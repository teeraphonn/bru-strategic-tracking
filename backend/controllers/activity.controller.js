const fs = require('fs');
const path = require('path');
const prisma = require('../config/prisma');
const { updateProjectProgress } = require('./project.controller');

// Add a new activity (Plan Phase - Locks automatically upon creation)
const createActivity = async (req, res) => {
  try {
    const { projectId, name, description, activityDate, budget } = req.body;
    const pId = parseInt(projectId);
    if (isNaN(pId)) {
      return res.status(400).json({ message: 'รหัสโครงการไม่ถูกต้อง (Invalid Project ID)' });
    }

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: pId },
      include: { users: true }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const userRole = req.user.role;
    const userId = req.user.id;
    const isAssigned = project.users.some(u => u.userId === userId);

    if (userRole !== 'ADMIN' && project.creatorId !== userId && !isAssigned) {
      return res.status(403).json({ message: 'You do not have permission to add activities to this project' });
    }

    // Create activity (isLocked = true, meaning planning fields are locked immediately)
    const activity = await prisma.activity.create({
      data: {
        projectId: pId,
        name,
        description,
        activityDate: new Date(activityDate),
        budget: parseFloat(budget),
        isLocked: true, // Lock immediately upon save
        success: false,
        completedCount: 0
      }
    });

    // Recalculate project totals automatically
    await updateProjectProgress(pId);

    res.status(201).json(activity);
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({ message: 'Failed to create activity', error: error.message });
  }
};

// Update activity progress or plan details
const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const activityId = parseInt(id);
    if (isNaN(activityId)) {
      return res.status(400).json({ message: 'รหัสกิจกรรมไม่ถูกต้อง (Invalid Activity ID)' });
    }
    const {
      name,
      description,
      activityDate,
      budget,
      actualBudget,
      success,
      completedCount,
      remark
    } = req.body;

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { project: { include: { users: true } } }
    });

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    const userRole = req.user.role;
    const userId = req.user.id;
    const isAssigned = activity.project.users.some(u => u.userId === userId);

    if (userRole !== 'ADMIN' && activity.project.creatorId !== userId && !isAssigned) {
      return res.status(403).json({ message: 'You do not have permission to modify this activity' });
    }

    // Enforce lock: if locked and not admin, name, description, date, and planned budget cannot be modified
    const isLocked = activity.isLocked;
    const dataUpdate = {};

    if (userRole === 'ADMIN' || !isLocked) {
      // Admin or unlocked plans can edit plan fields
      if (name !== undefined) dataUpdate.name = name;
      if (description !== undefined) dataUpdate.description = description;
      if (activityDate !== undefined) dataUpdate.activityDate = new Date(activityDate);
      if (budget !== undefined) {
        const parsedBudget = parseFloat(budget);
        if (isNaN(parsedBudget) || parsedBudget < 0) {
          return res.status(400).json({ message: 'Budget must be a non-negative number' });
        }
        dataUpdate.budget = parsedBudget;
      }
    }

    // Progress updates with boundary validations
    if (actualBudget !== undefined && actualBudget !== null) {
      const parsedActual = parseFloat(actualBudget);
      if (isNaN(parsedActual) || parsedActual < 0) {
        return res.status(400).json({ message: 'Actual budget must be a non-negative number' });
      }
      dataUpdate.actualBudget = parsedActual;
    }
    if (success !== undefined) {
      dataUpdate.success = success === 'true' || success === true;
    }
    if (completedCount !== undefined) {
      const parsedCount = parseInt(completedCount);
      if (isNaN(parsedCount) || parsedCount < 0) {
        return res.status(400).json({ message: 'Completed count must be a non-negative integer' });
      }
      dataUpdate.completedCount = parsedCount;
    }
    if (remark !== undefined) dataUpdate.remark = remark;

    // Handle files upload - upload to Cloudinary for persistent cloud storage
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const uploadResult = await cloudinary.uploader.upload(file.path, {
            folder: 'bru-strategic/activities',
            resource_type: 'image',
          console.error('Cloudinary upload error:', uploadErr);
          // Fallback: store as local path if Cloudinary fails
        } finally {
          // Always clean up temp file from disk
    const updated = await prisma.$transaction(async (tx) => {
      const act = await tx.activity.update({
        where: { id: activityId },
        data: {
          ...dataUpdate,
          images: images.length > 0 ? { create: images } : undefined
        },
        include: { images: true }

      await updateProjectProgress(activity.projectId, tx);
      return act;
    });

    res.json(updated);
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({ message: 'Failed to update activity', error: error.message });
  }
};

// Delete image from activity
const deleteActivityImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const imgId = parseInt(imageId);
    if (isNaN(imgId)) {
      return res.status(400).json({ message: 'รหัสรูปภาพไม่ถูกต้อง (Invalid Image ID)' });
    }

    const image = await prisma.activityImage.findUnique({
      where: { id: imgId },
      include: { activity: { include: { project: { include: { users: true } } } } }
    });

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Auth validation
    const userRole = req.user.role;
    const userId = req.user.id;
    const isAssigned = image.activity.project.users.some(u => u.userId === userId);

    if (userRole !== 'ADMIN' && image.activity.project.creatorId !== userId && !isAssigned) {
      return res.status(403).json({ message: 'You do not have permission to delete this image' });
    }

    // Delete from Cloudinary if it's a Cloudinary URL
    if (image.filePath && image.filePath.includes('cloudinary.com')) {
      try {
        // Extract public_id from Cloudinary URL (format: .../bru-strategic/activities/filename)
        const urlParts = image.filePath.split('/');
        const folderIdx = urlParts.findIndex(p => p === 'bru-strategic');
        if (folderIdx !== -1) {
          const publicId = urlParts.slice(folderIdx).join('/').replace(/\.[^.]+$/, '');
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (cdnErr) {
        console.error('Cloudinary delete error (non-fatal):', cdnErr);
      }
    } else if (image.filePath && !image.filePath.startsWith('data:') && !image.filePath.startsWith('http')) {
};

// Delete activity
const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const activityId = parseInt(id);
    if (isNaN(activityId)) {
      return res.status(400).json({ message: 'รหัสกิจกรรมไม่ถูกต้อง (Invalid Activity ID)' });
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { project: { include: { users: true } }, images: true }
    });

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Auth validation: Admin or Project Creator or Assigned User can delete activity automatically
    const userRole = req.user.role;
    const userId = req.user.id;
    const isAssigned = activity.project.users ? activity.project.users.some(u => u.userId === userId) : false;

    if (userRole !== 'ADMIN' && activity.project.creatorId !== userId && !isAssigned) {
      return res.status(403).json({ message: 'You do not have permission to delete this activity' });
    }

    // Delete images from disk if local path
    activity.images.forEach(img => {
      if (img.filePath && !img.filePath.startsWith('data:')) {
        const absolutePath = path.join(__dirname, '..', img.filePath);
        if (fs.existsSync(absolutePath)) {
          fs.unlinkSync(absolutePath);
        }
      }
    });

    await prisma.activity.delete({ where: { id: activityId } });

    // Recalculate project accomplishments
    await updateProjectProgress(activity.projectId);

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({ message: 'Failed to delete activity', error: error.message });
  }
};

// Toggle Activity lock status (Admin only)
const toggleActivityLock = async (req, res) => {
  try {
    const { id } = req.params;
    const activityId = parseInt(id);
    if (isNaN(activityId)) {
      return res.status(400).json({ message: 'รหัสกิจกรรมไม่ถูกต้อง (Invalid Activity ID)' });
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId }
    });

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    const updated = await prisma.activity.update({
      where: { id: activityId },
      data: { isLocked: !activity.isLocked }
    });

    res.json({
      message: updated.isLocked ? 'ล็อกแผนกิจกรรมเรียบร้อยแล้ว' : 'ปลดล็อกแผนกิจกรรมเรียบร้อยแล้ว',
      isLocked: updated.isLocked
    });
  } catch (error) {
    console.error('Toggle activity lock error:', error);
    res.status(500).json({ message: 'Failed to toggle activity lock status', error: error.message });
  }
};

// Get all activities (filtered by project or user assignment)
const getActivities = async (req, res) => {
  try {
    const { projectId, search, status, facultyId, departmentId, fiscalYearId } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    let whereClause = {};

    const parsedProjId = parseInt(projectId);
    if (projectId && !isNaN(parsedProjId)) {
      whereClause.projectId = parsedProjId;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { project: { name: { contains: search } } }
      ];
    }

    if (status === 'completed') {
      whereClause.success = true;
    } else if (status === 'pending') {
      whereClause.success = false;
    }

    // Prepare project conditions
    let projectConditions = {};

    const parsedFiscalYearId = parseInt(fiscalYearId);
    if (fiscalYearId && !isNaN(parsedFiscalYearId)) {
      projectConditions.fiscalYearId = parsedFiscalYearId;
    }

    // Role-based visibility and filters
    if (userRole === 'TEACHER') {
      projectConditions.OR = [
        { creatorId: userId },
        { users: { some: { userId } } }
      ];
    } else if (userRole === 'DEAN') {
      const userFacultyId = req.user.department?.facultyId;
      projectConditions.facultyId = userFacultyId || 0;
    } else if (userRole === 'ADMIN') {
      const parsedFacultyId = parseInt(facultyId);
      if (facultyId && !isNaN(parsedFacultyId)) {
        projectConditions.facultyId = parsedFacultyId;
      }
      const parsedDeptId = parseInt(departmentId);
      if (departmentId && !isNaN(parsedDeptId)) {
        projectConditions.departmentId = parsedDeptId;
      }
    }

    if (Object.keys(projectConditions).length > 0) {
      whereClause.project = projectConditions;
    }

    const activities = await prisma.activity.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            unit: true,
            targetCount: true,
            fiscalYear: true,
            department: true,
            subStrategy: {
              include: {
                strategy: true
              }
            }
          }
        },
        images: true
      },
      orderBy: { activityDate: 'desc' }
    });

    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ message: 'Failed to fetch activities', error: error.message });
  }
};

module.exports = {
  createActivity,
  updateActivity,
  deleteActivityImage,
  deleteActivity,
  toggleActivityLock,
  getActivities
};
