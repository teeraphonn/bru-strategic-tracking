/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: backend/controllers/project.controller.js
 * หน้าที่: คอนโทรลเลอร์สำหรับบริหารจัดการโครงการตามยุทธศาสตร์ (Project Controller)
 *          - คำนวณความก้าวหน้าสะสม % และยอดผลผลิตคงเหลือ (updateProjectProgress)
 *          - สร้างข้อเสนอโครงการใหม่และผูกผู้รับผิดชอบ (createProject)
 *          - ดึงรายการโครงการพร้อมแบ่งหน้าและกรองตามสิทธิ์ RBAC (getProjects)
 *          - ดึงรายละเอียดโครงการเดี่ยวพร้อมกิจกรรมและภาพถ่าย (getProject)
 *          - แก้ไขข้อมูลโครงการและล็อกแผนงานหากเริ่มมีกิจกรรมแล้ว (updateProject)
 *          - ลบโครงการพร้อมลบไฟล์รูปภาพกิจกรรมบนดิสก์ (deleteProject)
 *          - สลับสถานะล็อก/ปลดล็อกโครงการเพื่อป้องกันการลบ (toggleProjectLock)
 *          - บันทึกข้อสั่งการของผู้บริหารระดับคณบดีและอธิการบดี (updateExecutiveDirective)
 * ============================================================================
 */

const prisma = require('../config/prisma');

/**
 * ฟังก์ชันช่วยคำนวณและอัปเดตความก้าวหน้าของโครงการ (Progress Calculation Helper)
 * - นับยอดผลผลิตที่ทำได้จริงจากกิจกรรมย่อยทั้งหมด (completedCount)
 * - คำนวณร้อยละความก้าวหน้า (% Progress = (completed / target) * 100)
 * - อัปเดตยอดคงเหลือ (remainingCount = target - completed)
 * @param {number} projectId - รหัสโครงการ
 * @param {Object} txClient - Prisma Client หรือ Transaction Client
 */
const updateProjectProgress = async (projectId, txClient = prisma) => {
  const project = await txClient.project.findUnique({
    where: { id: projectId },
    include: { activities: true }
  });

  if (!project) return;

  // รวมยอดผลผลิตจากทุกกิจกรรมย่อย
  const completedCount = project.activities.reduce((sum, a) => {
    if (a.completedCount && a.completedCount > 0) {
      return sum + a.completedCount;
    }
    return sum + (a.success ? 1 : 0);
  }, 0);

  const targetCount = Math.max(1, project.targetCount || 1);
  const remainingCount = Math.max(0, targetCount - completedCount);

  // คำนวณเปอร์เซ็นต์ความก้าวหน้า สูงสุดไม่เกิน 100.0%
  let progress = 0.0;
  if (targetCount > 0) {
    progress = parseFloat(((completedCount / targetCount) * 100).toFixed(2));
  }
  progress = Math.min(Math.max(0, progress), 100.0);

  // บันทึกความก้าวหน้ากลับสู่ตาราง Project
  await txClient.project.update({
    where: { id: projectId },
    data: {
      completedCount,
      remainingCount,
      progress
    }
  });
};

/**
 * สร้างข้อเสนอโครงการใหม่ (Create Project)
 * POST /api/projects
 */
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
      userIds // รหัสผู้รับผิดชอบโครงการที่มอบหมาย
    } = req.body;

    const creatorId = req.user.id;
    // สังกัดของผู้สร้างโครงการ (ภาควิชา และ คณะ)
    const departmentId = req.user.departmentId;
    const facultyId = req.user.department?.facultyId || null;

    // ─── บันทึกข้อมูลโครงการพร้อมผูกผู้รับผิดชอบด้วย Database Transaction ────
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

      // เพิ่มผู้สร้างโครงการเป็นผู้รับผิดชอบอัตโนมัติ และเพิ่มผู้รับผิดชอบร่วมอื่นๆ
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

/**
 * ดึงรายการโครงการทั้งหมดตามเงื่อนไข (Get Projects List with Filters & Pagination)
 * GET /api/projects
 * รองรับการคัดกรองตามสิทธิ์ (RBAC: Teacher เห็นเฉพาะโครงการตนเอง, Dean เห็นทั้งคณะ, President/Admin เห็นทั้งหมด)
 */
const getProjects = async (req, res) => {
  try {
    // ─── 1. รับค่าพารามิเตอร์การแบ่งหน้าและค้นหา ───────────────────────────
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search || '';
    const fiscalYearId = req.query.fiscalYearId ? parseInt(req.query.fiscalYearId) : undefined;
    const departmentId = req.query.departmentId ? parseInt(req.query.departmentId) : undefined;
    const facultyId = req.query.facultyId ? parseInt(req.query.facultyId) : undefined;
    const localIssueId = req.query.localIssueId ? parseInt(req.query.localIssueId) : undefined;
    const strategyId = req.query.strategyId ? parseInt(req.query.strategyId) : undefined;
    const subStrategyId = req.query.subStrategyId ? parseInt(req.query.subStrategyId) : undefined;
    const indicatorId = req.query.indicatorId ? parseInt(req.query.indicatorId) : undefined;

    // ─── 2. สร้างเงื่อนไข Where Query ─────────────────────────────────────
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }

    if (fiscalYearId) where.fiscalYearId = fiscalYearId;
    if (indicatorId) where.indicatorId = indicatorId;

    // กรองตามลำดับขั้นยุทธศาสตร์ 4 ระดับ
    if (subStrategyId) {
      where.subStrategyId = subStrategyId;
    } else if (strategyId) {
      where.subStrategy = { strategyId };
    } else if (localIssueId) {
      where.subStrategy = { strategy: { localIssueId } };
    }

    const status = req.query.status;
    if (status === 'completed') {
      where.progress = { gte: 100.0 };
    } else if (status === 'inprogress') {
      where.progress = { lt: 100.0 };
    }

    // ─── 3. กรองข้อมูลตามสิทธิ์บทบาทผู้ใช้งาน (RBAC) ───────────────────────
    const userRole = req.user.role;
    const userId = req.user.id;
    const userFacultyId = req.user.department?.facultyId;

    if (userRole === 'ADMIN' || userRole === 'PRESIDENT') {
      // ผู้บริหารระดับสูงและแอดมิน: เห็นโครงการได้ทั้งหมดทั่วทั้งมหาวิทยาลัย
      if (departmentId) where.departmentId = departmentId;
      if (facultyId) where.facultyId = facultyId;
    } else if (userRole === 'DEAN') {
      // คณบดี: เห็นเฉพาะโครงการภายในคณะตนเองเท่านั้น
      if (!userFacultyId) {
        return res.status(400).json({ message: 'Dean user must belong to a Faculty' });
      }
      where.OR = [
        { facultyId: userFacultyId },
        { department: { facultyId: userFacultyId } }
      ];
      if (departmentId) where.departmentId = departmentId; // กรองเจาะจงภาควิชาในคณะได้
    } else if (userRole === 'TEACHER') {
      // อาจารย์: เห็นเฉพาะโครงการที่ตนเองเป็นผู้สร้าง หรือได้รับการมอบหมายเป็นผู้รับผิดชอบ
      where.OR = [
        { creatorId: userId },
        { users: { some: { userId: userId } } }
      ];
      if (search) {
        where.AND = [
          { OR: [{ name: { contains: search } }, { description: { contains: search } }] }
        ];
      }
    }

    // ─── 4. ดึงข้อมูลจากฐานข้อมูลพร้อมจำนวนทั้งหมด ─────────────────────────
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
          subStrategy: { 
            include: { 
              strategy: { 
                include: { localIssue: true } 
              } 
            } 
          },
          indicator: true,
          department: { include: { faculty: true } },
          faculty: true,
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

/**
 * ดึงข้อมูลโครงการเดี่ยวแบบละเอียด (Get Single Project Details)
 * GET /api/projects/:id
 */
const getProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        creator: { select: { id: true, name: true, role: true } },
        fiscalYear: true,
        budgetSource: true,
        subStrategy: { 
          include: { 
            strategy: { 
              include: { localIssue: true } 
            } 
          } 
        },
        indicator: true,
        department: { include: { faculty: true } },
        faculty: true,
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

    // ─── ตรวจสอบสิทธิ์การเข้าดูรายละเอียดโครงการ ──────────────────────────
    const userRole = req.user.role;
    const userId = req.user.id;
    if (userRole === 'TEACHER') {
      const isAssigned = project.users.some(u => u.userId === userId);
      if (project.creatorId !== userId && !isAssigned) {
        return res.status(403).json({ message: 'Access denied to this project' });
      }
    } else if (userRole === 'DEAN') {
      const userFacultyId = req.user.department?.facultyId;
      const projFacultyId = project.facultyId || project.department?.facultyId;
      if (!userFacultyId || projFacultyId !== userFacultyId) {
        return res.status(403).json({ message: 'Access denied: project is outside your faculty' });
      }
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Failed to fetch project details', error: error.message });
  }
};

/**
 * แก้ไขข้อมูลโครงการ (Update Project)
 * PUT /api/projects/:id
 * มีระบบ Plan Locking: หากมีกิจกรรมย่อยแล้ว ไม่อนุญาตให้ผู้ใช้ทั่วไปแก้ไขงบประมาณรวมหรือเป้าหมาย
 */
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

    // ─── 1. ตรวจสอบสิทธิ์: เฉพาะ Admin, ผู้สร้าง, หรือผู้ได้รับมอบหมาย ─────
    const userRole = req.user.role;
    const userId = req.user.id;
    const isAssigned = project.users.some(u => u.userId === userId);
    if (userRole !== 'ADMIN' && project.creatorId !== userId && !isAssigned) {
      return res.status(403).json({ message: 'You do not have permission to edit this project' });
    }

    // ─── 2. ระบบล็อกแผนงาน (Plan Locking) ─────────────────────────────────
    // ป้องกันการเปลี่ยนยอดงบประมาณหรือเป้าหมาย หากโครงการมีกิจกรรมย่อยเริ่มดำเนินงานแล้ว
    const hasActivities = project.activities && project.activities.length > 0;
    const isChangingTargetOrBudget = 
      parseFloat(totalBudget) !== parseFloat(project.totalBudget) ||
      parseInt(targetCount) !== parseInt(project.targetCount);

    if (hasActivities && isChangingTargetOrBudget && userRole !== 'ADMIN') {
      return res.status(400).json({
        message: 'ไม่สามารถแก้ไขงบประมาณรวมหรือเป้าหมายได้ เนื่องจากโครงการนี้มีกิจกรรมในแผนงานแล้ว (Plan Locked)'
      });
    }

    // ตรวจสอบว่าเป้าหมายใหม่ต้องไม่น้อยกว่ายอดผลผลิตที่ทำเสร็จไปแล้ว
    const newTargetCount = parseInt(targetCount);
    if (newTargetCount <= 0) {
      return res.status(400).json({ message: 'Target count must be greater than 0' });
    }
    if (project.completedCount > newTargetCount && userRole !== 'ADMIN') {
      return res.status(400).json({
        message: `Completed count (${project.completedCount}) cannot exceed new target count (${newTargetCount}).`
      });
    }

    // ─── 3. อัปเดตข้อมูลโครงการและผู้รับผิดชอบ ─────────────────────────────
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

      // อัปเดตรายชื่อผู้รับผิดชอบใหม่
      if (userIds && Array.isArray(userIds)) {
        await tx.projectUser.deleteMany({ where: { projectId } });

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

    // คำนวณเปอร์เซ็นต์ความก้าวหน้าใหม่
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

/**
 * ลบโครงการ (Delete Project)
 * DELETE /api/projects/:id
 * - ป้องกันการลบหากโครงการถูกล็อก (isLocked: true)
 * - ลบไฟล์รูปภาพกิจกรรมจริงออกจากระบบไฟล์ (Disk Cleanup)
 */
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

    // ─── 1. ตรวจสอบสิทธิ์การลบ: เฉพาะ Admin หรือผู้สร้างโครงการ ─────────────
    const userRole = req.user.role;
    const userId = req.user.id;

    if (userRole !== 'ADMIN' && project.creatorId !== userId) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์ในการลบโครงการนี้' });
    }

    // ─── 2. ตรวจสอบสถานะล็อกโครงการ (Project Lock Check) ─────────────────
    if (project.isLocked) {
      return res.status(400).json({
        message: 'โครงการนี้ถูกสั่งล็อกแผนงานไว้! กรุณายื่นคำร้องขออนุมัติให้ Admin ปลดล็อกแผนงานก่อนลบ',
        isLocked: true
      });
    }

    // ─── 3. ลบไฟล์รูปภาพกิจกรรมจริงออกจากดิสก์ ─────────────────────────────
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

    // ─── 4. ลบข้อมูลโครงการจากฐานข้อมูล (Cascade ลบกิจกรรมและภาพ) ──────────
    await prisma.project.delete({ where: { id: projectId } });
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Failed to delete project', error: error.message });
  }
};

/**
 * สลับสถานะล็อกโครงการ (Toggle Project Lock)
 * PATCH /api/projects/:id/toggle-lock
 * สงวนสิทธิ์เฉพาะ Admin: สำหรับป้องกันไม่ให้ผู้ใช้ลบโครงการที่กำลังกำกับติดตาม
 */
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

/**
 * บันทึกข้อสั่งการของผู้บริหาร (Update Executive Directive)
 * POST /api/projects/:id/directive
 * รองรับการสั่งการแยกตามบทบาท (คณบดี Dean, อธิการบดี President)
 */
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

    // ป้องกันการข้ามสิทธิ์ (IDOR): คณบดีสั่งการได้เฉพาะโครงการในคณะตนเอง
    if (userRole === 'DEAN') {
      const userFacultyId = req.user.department?.facultyId;
      const projFacultyId = project.facultyId || (await prisma.department.findUnique({ where: { id: project.departmentId } }))?.facultyId;
      if (!userFacultyId || projFacultyId !== userFacultyId) {
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
