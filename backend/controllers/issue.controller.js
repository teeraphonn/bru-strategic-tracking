/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: backend/controllers/issue.controller.js
 * หน้าที่: คอนโทรลเลอร์สำหรับระบบแจ้งปัญหาการใช้งานและศูนย์ช่วยเหลือ (Issue Tracking Controller)
 *          - ผู้ใช้งานเปิด Ticket แจ้งปัญหาการใช้งานระบบ (createIssue)
 *          - ดึงประวัติรายการปัญหาของผู้ใช้ปัจจุบัน (getMyIssues)
 *          - ดึงรายการแจ้งปัญหาทั้งหมดสำหรับผู้ดูแลระบบ (getAllIssues)
 *          - อัปเดตสถานะการแก้ปัญหาและบันทึกหมายเหตุการตอบกลับ (updateIssue)
 *          - ลบรายการแจ้งปัญหา (deleteIssue)
 *          - สร้างและส่งข้อมูลแจ้งเตือน (Notifications) สำหรับไอคอนกระดิ่งบน Topbar (getNotifications)
 * ============================================================================
 */

const prisma = require('../config/prisma');

/**
 * สร้างรายการแจ้งปัญหาการใช้งานระบบใหม่ (Create Issue Report)
 * POST /api/issues
 */
exports.createIssue = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;
    const userId = req.user.id;

    if (!title || !description) {
      return res.status(400).json({ message: 'กรุณากรอกหัวข้อและรายละเอียดปัญหาระบบ' });
    }

    const newIssue = await prisma.issueReport.create({
      data: {
        title,
        description,
        category: category || 'ทั่วไป',
        priority: priority || 'MEDIUM',
        status: 'PENDING',
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            department: {
              include: {
                faculty: true
              }
            }
          }
        }
      }
    });

    return res.status(201).json({
      message: 'ส่งรายงานปัญหาระบบเรียบร้อยแล้ว',
      data: newIssue
    });
  } catch (error) {
    console.error('Error creating issue:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่งรายงานปัญหาระบบ' });
  }
};

/**
 * ดึงรายการปัญหาที่ผู้ใช้ปัจจุบันเคยส่งแจ้งไว้ (Get My Submitted Issues)
 * GET /api/issues/my
 */
exports.getMyIssues = async (req, res) => {
  try {
    const userId = req.user.id;

    const issues = await prisma.issueReport.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ data: issues });
  } catch (error) {
    console.error('Error fetching my issues:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการรายงานปัญหา' });
  }
};

/**
 * ดึงรายการปัญหาทั้งหมดในระบบสำหรับผู้ดูแลระบบ (Get All Issues - Admin Only)
 * GET /api/issues
 */
exports.getAllIssues = async (req, res) => {
  try {
    const { status, priority } = req.query;

    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const issues = await prisma.issueReport.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            department: {
              include: {
                faculty: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ data: issues });
  } catch (error) {
    console.error('Error fetching all issues:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการรายงานปัญหาระบบทั้งหมด' });
  }
};

/**
 * อัปเดตสถานะปัญหาและตอบกลับข้อความ (Update Issue Status & Note - Admin Only)
 * PATCH /api/issues/:id
 */
exports.updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    const existingIssue = await prisma.issueReport.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingIssue) {
      return res.status(404).json({ message: 'ไม่พบรายการแจ้งปัญหานี้' });
    }

    const updatedIssue = await prisma.issueReport.update({
      where: { id: parseInt(id) },
      data: {
        ...(status && { status }),
        adminNote: adminNote !== undefined ? adminNote : existingIssue.adminNote
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            department: {
              include: {
                faculty: true
              }
            }
          }
        }
      }
    });

    return res.json({
      message: 'อัปเดตสถานะปัญหาระบบเรียบร้อยแล้ว',
      data: updatedIssue
    });
  } catch (error) {
    console.error('Error updating issue:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตปัญหาระบบ' });
  }
};

/**
 * ลบรายการแจ้งปัญหา (Delete Issue Report - Admin Only)
 * DELETE /api/issues/:id
 */
exports.deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;

    const existingIssue = await prisma.issueReport.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingIssue) {
      return res.status(404).json({ message: 'ไม่พบรายการแจ้งปัญหานี้' });
    }

    await prisma.issueReport.delete({
      where: { id: parseInt(id) }
    });

    return res.json({ message: 'ลบรายการแจ้งปัญหาระบบเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error deleting issue:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบรายการแจ้งปัญหาระบบ' });
  }
};

/**
 * ดึงรายการแจ้งเตือนสำหรับไอคอนกระดิ่งบน Topbar (Get Notification Feed)
 * GET /api/issues/notifications
 * - Admin: ได้รับแจ้งเตือนเมื่อมีปัญหาใหม่ที่ค้างอยู่ (PENDING)
 * - User: ได้รับแจ้งเตือนเมื่อ Admin อัปเดตสถานะหรือตอบกลับข้อความ
 */
exports.getNotifications = async (req, res) => {
  try {
    const user = req.user;
    const notifications = [];

    // ─── 1. แจ้งเตือนสำหรับ Admin: ปัญหาใหม่ที่รอดำเนินการ ────────────────
    if (user.role === 'ADMIN') {
      const pendingIssues = await prisma.issueReport.findMany({
        where: { status: 'PENDING' },
        include: {
          user: {
            select: { id: true, name: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      pendingIssues.forEach(issue => {
        notifications.push({
          id: `issue-admin-${issue.id}-${new Date(issue.createdAt).getTime()}`,
          issueId: issue.id,
          type: 'ADMIN_NEW_ISSUE',
          title: `รายงานปัญหาระบบใหม่: ${issue.title}`,
          subtitle: `โดย ${issue.user?.name || 'ผู้ใช้งาน'} (${issue.category || 'ทั่วไป'})`,
          status: issue.status,
          createdAt: issue.createdAt
        });
      });
    }

    // ─── 2. แจ้งเตือนสำหรับ User: การอัปเดตสถานะหรือคำตอบจาก Admin ───────
    const userUpdatedIssues = await prisma.issueReport.findMany({
      where: {
        userId: user.id
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    userUpdatedIssues.forEach(issue => {
      const isUpdated = issue.adminNote !== null || issue.status !== 'PENDING' || issue.updatedAt.getTime() !== issue.createdAt.getTime();

      if (isUpdated) {
        let statusText = 'ได้รับการอัปเดตสถานะ';
        if (issue.status === 'PENDING') statusText = 'อยู่ระหว่างรอดำเนินการ';
        else if (issue.status === 'IN_PROGRESS') statusText = 'อยู่ระหว่างกำลังดำเนินการแก้ไข';
        else if (issue.status === 'RESOLVED') statusText = 'ได้รับการแก้ไขเรียบร้อยแล้ว';
        else if (issue.status === 'REJECTED') statusText = 'ได้รับการตรวจสอบ/ตอบกลับแล้ว';

        notifications.push({
          id: `issue-user-${issue.id}-${new Date(issue.updatedAt).getTime()}`,
          issueId: issue.id,
          type: 'USER_ISSUE_UPDATE',
          title: `เรื่อง "${issue.title}" ${statusText}`,
          subtitle: issue.adminNote ? `ข้อความจาก Admin: ${issue.adminNote}` : `สถานะปัจจุบัน: ${statusText}`,
          status: issue.status,
          createdAt: issue.updatedAt
        });
      }
    });

    // เรียงลำดับแจ้งเตือนตามเวลาล่าสุด
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ data: notifications });
  } catch (error) {
    console.error('Error fetching issue notifications:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน' });
  }
};
