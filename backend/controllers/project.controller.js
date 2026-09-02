const prisma = require('../config/prisma');

// Helper to calculate progress and validation
const updateProjectProgress = async (projectId, txClient = prisma) => {
  const project = await txClient.project.findUnique({
    where: { id: projectId },
    include: { activities: true }
  });

  if (!project) return;

  const completedCount = project.activities.reduce((sum, a) => {
    if (a.completedCount && a.completedCount > 0) {
      return sum + a.completedCount;
    }
    return sum + (a.success ? 1 : 0);
  }, 0);

  const targetCount = Math.max(1, project.targetCount || 1);
  const remainingCount = Math.max(0, targetCount - completedCount);

  let progress = 0.0;
  if (targetCount > 0) {
    progress = parseFloat(((completedCount / targetCount) * 100).toFixed(2));
  }
  progress = Math.min(Math.max(0, progress), 100.0);

  await txClient.project.update({
    where: { id: projectId },
    data: {
      completedCount,
      remainingCount,
      progress
    }
  });
};

const createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      fiscalYearId,
      budgetSourceId,
      subStrategyId,
      indicatorId,
      totalBudget,
      targetCount,
      unit,
      startDate,
      endDate,
      userIds // Array of user IDs responsible for the project
    } = req.body;

    const creatorId = req.user.id;
    // Creator's department and faculty
    const departmentId = req.user.departmentId;
    const facultyId = req.user.department?.facultyId || null;

    // Create project
    const project = await prisma.$transaction(async (tx) => {
      const proj = await tx.project.create({
        data: {
          name,
          description,
          fiscalYearId: parseInt(fiscalYearId),
          budgetSourceId: parseInt(budgetSourceId),
          subStrategyId: parseInt(subStrategyId),
          indicatorId: indicatorId ? parseInt(indicatorId) : null,
          totalBudget: parseFloat(totalBudget),
          targetCount: parseInt(targetCount),
          unit,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          completedCount: 0,
          remainingCount: parseInt(targetCount),
          progress: 0.0,
          creatorId,
          departmentId,
          facultyId
        }
      });

      // Link responsibles (creator is automatically added, plus others in userIds)
      const uniqueUserIds = new Set([creatorId]);
      if (userIds && Array.isArray(userIds)) {
        userIds.forEach(id => uniqueUserIds.add(parseInt(id)));
      }

      const relations = Array.from(uniqueUserIds).map(uId => ({
        projectId: proj.id,
        userId: uId
      }));

      await tx.projectUser.createMany({
        data: relations
      });

      return proj;
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Failed to create project', error: error.message });
  }
};

const getProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || '';
    const fiscalYearId = req.query.fiscalYearId ? parseInt(req.query.fiscalYearId) : undefined;
    const departmentId = req.query.departmentId ? parseInt(req.query.departmentId) : undefined;
    const facultyId = req.query.facultyId ? parseInt(req.query.facultyId) : undefined;
    const subStrategyId = req.query.subStrategyId ? parseInt(req.query.subStrategyId) : undefined;
    const indicatorId = req.query.indicatorId ? parseInt(req.query.indicatorId) : undefined;

    // Define where conditions
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }

    if (fiscalYearId) where.fiscalYearId = fiscalYearId;
    if (subStrategyId) where.subStrategyId = subStrategyId;
    if (indicatorId) where.indicatorId = indicatorId;

    const status = req.query.status;
    if (status === 'completed') {
      where.progress = { gte: 100.0 };
    } else if (status === 'inprogress') {
      where.progress = { lt: 100.0 };
    }

    // RBAC logic for project filtering
    const userRole = req.user.role;
    const userId = req.user.id;
    const userDeptId = req.user.departmentId;
    const userFacultyId = req.user.department?.facultyId;

    if (userRole === 'ADMIN' || userRole === 'PRESIDENT') {
      // Sees all
      if (departmentId) where.departmentId = departmentId;
      if (facultyId) where.facultyId = facultyId;
    } else if (userRole === 'DEAN') {
      // Sees all in faculty
      if (!userFacultyId) {
        return res.status(400).json({ message: 'Dean user must belong to a Faculty' });
      }
      where.OR = [
        { facultyId: userFacultyId },
        { department: { facultyId: userFacultyId } }
      ];
      if (departmentId) where.departmentId = departmentId; // can narrow down within faculty
    } else if (userRole === 'TEACHER') {
      // Sees only projects where they are creator OR they are assigned
      where.OR = [
        { creatorId: userId },
        { users: { some: { userId: userId } } }
      ];
      // Filter text search if provided
      if (search) {
        where.AND = [
          { OR: [{ name: { contains: search } }, { description: { contains: search } }] }
        ];
      }
    }

    const [total, list] = await prisma.$transaction([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, name: true, role: true } },
          fiscalYear: true,
          budgetSource: true,
          subStrategy: { include: { strategy: true } },
          indicator: true,
          department: { include: { faculty: true } },
          users: { include: { user: { select: { id: true, name: true } } } },
          activities: {
            include: {
              images: true
            },
            orderBy: { activityDate: 'desc' }
          },
          _count: { select: { activities: true } }
        }
      })
    ]);

    res.json({
      projects: list,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Failed to fetch projects', error: error.message });
  }
};

const getProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        creator: { select: { id: true, name: true, role: true } },
        fiscalYear: true,
        budgetSource: true,
        subStrategy: { include: { strategy: true } },
        indicator: true,
        department: { include: { faculty: true } },
        users: { include: { user: { select: { id: true, name: true, username: true } } } },
        activities: {
          include: {
            images: true
          },
          orderBy: [
            { activityDate: 'asc' },
            { id: 'asc' }
          ]
        }
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify access rights
    const userRole = req.user.role;
    const userId = req.user.id;
    if (userRole === 'TEACHER') {
      const isAssigned = project.users.some(u => u.userId === userId);
      if (project.creatorId !== userId && !isAssigned) {
        return res.status(403).json({ message: 'Access denied to this project' });
      }
    } else if (userRole === 'DEAN') {
      if (project.facultyId !== req.user.department?.facultyId) {
        return res.status(403).json({ message: 'Access denied: project is outside your faculty' });
      }
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Failed to fetch project details', error: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const projectId = parseInt(id);
    const {
      name,
      description,
      fiscalYearId,
      budgetSourceId,
      subStrategyId,
      indicatorId,
      totalBudget,
      targetCount,
      unit,
      startDate,
      endDate,
      userIds
    } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { users: true, activities: true }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Authorization: Only Admin or Project Creator or Assigned users can update
    const userRole = req.user.role;
    const userId = req.user.id;
    const isAssigned = project.users.some(u => u.userId === userId);
    if (userRole !== 'ADMIN' && project.creatorId !== userId && !isAssigned) {
      return res.status(403).json({ message: 'You do not have permission to edit this project' });
    }

    // Plan Locking: Prevent non-admins from altering total budget or target count if activities already exist
    const hasActivities = project.activities && project.activities.length > 0;
    const isChangingTargetOrBudget = 
      parseFloat(totalBudget) !== parseFloat(project.totalBudget) ||
      parseInt(targetCount) !== parseInt(project.targetCount);

    if (hasActivities && isChangingTargetOrBudget && userRole !== 'ADMIN') {
      return res.status(400).json({
        message: 'ไม่สามารถแก้ไขงบประมาณรวมหรือเป้าหมายได้ เนื่องจากโครงการนี้มีกิจกรรมในแผนงานแล้ว (Plan Locked)'
      });
    }

    // Check Completed count vs Target count. Completed count cannot exceed target count unless admin
    const newTargetCount = parseInt(targetCount);
    if (newTargetCount <= 0) {
      return res.status(400).json({ message: 'Target count must be greater than 0' });
    }
    if (project.completedCount > newTargetCount && userRole !== 'ADMIN') {
      return res.status(400).json({
        message: `Completed count (${project.completedCount}) cannot exceed new target count (${newTargetCount}).`
      });
    }

    // Update project
    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: {
          name,
          description,
          fiscalYearId: parseInt(fiscalYearId),
          budgetSourceId: parseInt(budgetSourceId),
          subStrategyId: parseInt(subStrategyId),
          indicatorId: indicatorId ? parseInt(indicatorId) : null,
          totalBudget: parseFloat(totalBudget),
          targetCount: newTargetCount,
          unit,
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        }
      });

      // Update users relation if provided
      if (userIds && Array.isArray(userIds)) {
        // Delete existing relations
        await tx.projectUser.deleteMany({ where: { projectId } });

        // Add creator automatically, and assign new ones
        const uniqueUserIds = new Set([project.creatorId]);
        userIds.forEach(uId => uniqueUserIds.add(parseInt(uId)));

        const relations = Array.from(uniqueUserIds).map(uId => ({
          projectId,
          userId: uId
        }));

        await tx.projectUser.createMany({
          data: relations
        });
      }
    });

    // Re-calculate progress
    await updateProjectProgress(projectId);

    const updated = await prisma.project.findUnique({
      where: { id: projectId },
      include: { users: { include: { user: { select: { id: true, name: true } } } } }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Failed to update project', error: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const projectId = parseInt(id);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        activities: {
          include: { images: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Auth & Lock validation
    const userRole = req.user.role;
    const userId = req.user.id;

    if (userRole !== 'ADMIN' && project.creatorId !== userId) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ในการลบโครงการนี้' });
    }

    // Check project lock: If project is locked, deletion is blocked!
    if (project.isLocked) {
      return res.status(400).json({
        message: 'โครงการนี้ถูกสั่งล็อกแผนงานไว้! กรุณายื่นคำร้องขออนุมัติให้ Admin ปลดล็อกแผนงานก่อนลบ',
        isLocked: true
      });
    }

    // Clean up associated physical activity image files from disk
    const fs = require('fs');
    const path = require('path');
    if (project.activities && project.activities.length > 0) {
      project.activities.forEach(act => {
        if (act.images && act.images.length > 0) {
          act.images.forEach(img => {
            const absolutePath = path.join(__dirname, '..', img.filePath);
            if (fs.existsSync(absolutePath)) {
              try { fs.unlinkSync(absolutePath); } catch (e) { console.error('Failed to delete image file:', e); }
            }
          });
        }
      });
    }

    await prisma.project.delete({ where: { id: projectId } });
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Failed to delete project', error: error.message });
  }
};

// Toggle Project lock status (Admin only)
const toggleProjectLock = async (req, res) => {
  try {
    const { id } = req.params;
    const projectId = parseInt(id);

    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { isLocked: !project.isLocked }
    });

    res.json({
      message: updated.isLocked ? 'ล็อกโครงการและห้ามลบเรียบร้อยแล้ว' : 'ปลดล็อกโครงการเรียบร้อยแล้ว',
      isLocked: updated.isLocked
    });
  } catch (error) {
    console.error('Toggle project lock error:', error);
    res.status(500).json({ message: 'Failed to toggle project lock status', error: error.message });
  }
};

const updateExecutiveDirective = async (req, res) => {
  try {
    const { id } = req.params;
    const { directive } = req.body;
    const projectId = parseInt(id);

    const userRole = req.user.role;
    if (!['DEAN', 'PRESIDENT', 'ADMIN'].includes(userRole)) {
      return res.status(403).json({ message: 'Only Executive roles can issue Executive Directives' });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // IDOR Check: DEAN can only issue directive to projects belonging to their faculty
    if (userRole === 'DEAN') {
      const userFacultyId = req.user.department?.facultyId;
      if (!userFacultyId || project.facultyId !== userFacultyId) {
        return res.status(403).json({ message: 'Access denied: Cannot issue directive to project outside your faculty' });
      }
    }

    const issuerName = req.user.name || req.user.username;
    const now = new Date();

    const dataUpdate = {
      executiveDirective: directive,
      directiveUpdatedAt: now,
      directiveIssuerName: issuerName,
      directiveIssuerRole: userRole
    };

    if (userRole === 'DEAN') {
      dataUpdate.deanDirective = directive;
      dataUpdate.deanDirectiveUpdatedAt = now;
      dataUpdate.deanDirectiveIssuerName = issuerName;
    } else if (userRole === 'PRESIDENT') {
      dataUpdate.presidentDirective = directive;
      dataUpdate.presidentDirectiveUpdatedAt = now;
      dataUpdate.presidentDirectiveIssuerName = issuerName;
    } else if (userRole === 'ADMIN') {
      dataUpdate.deanDirective = directive;
      dataUpdate.deanDirectiveUpdatedAt = now;
      dataUpdate.deanDirectiveIssuerName = issuerName;
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: dataUpdate,
      include: {
        creator: { select: { id: true, name: true } },
        faculty: true,
        department: true
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Update executive directive error:', error);
    res.status(500).json({ message: 'Failed to update executive directive', error: error.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  toggleProjectLock,
  updateExecutiveDirective,
  updateProjectProgress
};
