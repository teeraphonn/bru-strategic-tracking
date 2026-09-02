const prisma = require('../config/prisma');

// Create a new issue report
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

// Get current user's submitted issue reports
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

// Admin: Get all issue reports with optional filtering
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

// Admin: Update issue status and admin note
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

// Admin: Delete issue report
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

// Get notifications for bell icon (Admin gets pending issues, User gets updated issues)
exports.getNotifications = async (req, res) => {
  try {
    const user = req.user;
    const notifications = [];

    if (user.role === 'ADMIN') {
      // Get pending issue reports submitted by any user
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

    // Get issue updates for current user (whenever Admin updates status or adminNote)
    const userUpdatedIssues = await prisma.issueReport.findMany({
      where: {
        userId: user.id
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });

    userUpdatedIssues.forEach(issue => {
      // Create notification if issue has been updated by Admin (adminNote present, status changed, or updatedAt > createdAt)
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

    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.json({ data: notifications });
  } catch (error) {
    console.error('Error fetching issue notifications:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน' });
  }
};
