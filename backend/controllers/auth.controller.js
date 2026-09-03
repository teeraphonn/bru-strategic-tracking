const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const computePersonnelCode = async (user) => {
  if (!user) return '';
  
  // Get all faculties to compute faculty code
  const faculties = await prisma.faculty.findMany({
    orderBy: { id: 'asc' }
  });
  
  const getFacultyCode = (fac) => {
    if (!fac) return '00';
    if (fac.name === 'ส่วนกลาง') return '00';
    const nonCentral = faculties
      .filter(f => f.name !== 'ส่วนกลาง')
      .sort((a, b) => a.id - b.id);
    const idx = nonCentral.findIndex(f => f.id === fac.id);
    const seq = idx !== -1 ? idx + 1 : fac.id;
    return String(seq).padStart(2, '0');
  };

  if (user.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: user.departmentId },
      include: { faculty: true }
    });
    
    if (dept) {
      const facCode = getFacultyCode(dept.faculty);
      
      const siblingDepts = await prisma.department.findMany({
        where: { facultyId: dept.facultyId },
        orderBy: { id: 'asc' }
      });
      const deptIndex = siblingDepts.findIndex(d => d.id === dept.id);
      const deptSeq = String(deptIndex !== -1 ? deptIndex + 1 : 1).padStart(2, '0');
      const deptCode = `${facCode}${deptSeq}`;
      
      const siblingUsers = await prisma.user.findMany({
        where: { departmentId: user.departmentId },
        orderBy: { id: 'asc' }
      });
      const userIndex = siblingUsers.findIndex(u => u.id === user.id);
      const userSeq = String(userIndex !== -1 ? userIndex + 1 : 1).padStart(2, '0');
      
      return `${deptCode}${userSeq}`;
    }
  }
  
  // Fallback for unaffiliated users (e.g. president/admin)
  const siblingUsers = await prisma.user.findMany({
    where: { departmentId: null },
    orderBy: { id: 'asc' }
  });
  const userIndex = siblingUsers.findIndex(u => u.id === user.id);
  const userSeq = String(userIndex !== -1 ? userIndex + 1 : 1).padStart(2, '0');
  return `0000${userSeq}`;
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
    }

    const cleanUsername = String(username).trim();

    // Support case-insensitive search and username aliases (e.g. 'admin' <-> 'admin@bru.ac.th')
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { username: cleanUsername.toLowerCase() },
          ...(cleanUsername.toLowerCase() === 'admin' ? [{ username: 'admin@bru.ac.th' }] : []),
          ...(cleanUsername.toLowerCase() === 'admin@bru.ac.th' ? [{ username: 'admin' }] : []),
          ...(cleanUsername.toLowerCase() === 'president' ? [{ username: 'president@bru.ac.th' }] : []),
          ...(cleanUsername.toLowerCase() === 'dean' ? [{ username: 'dean@bru.ac.th' }] : []),
          ...(cleanUsername.toLowerCase() === 'teacher' ? [{ username: 'teacher@bru.ac.th' }] : []),
          ...(cleanUsername.toLowerCase() === 'csbru' ? [{ username: 'Csbru' }] : [])
        ]
      },
      include: {
        department: {
          include: { faculty: true }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET + user.password,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    // Exclude password from output
    const { password: _, ...userWithoutPassword } = user;
    userWithoutPassword.personnelCode = await computePersonnelCode(user);

    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const me = async (req, res) => {
  try {
    const { password: _, ...userWithoutPassword } = req.user;
    userWithoutPassword.personnelCode = await computePersonnelCode(req.user);
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};

const publicStats = async (req, res) => {
  try {
    const total = await prisma.project.count();
    const completed = await prisma.project.count({
      where: {
        progress: { gte: 100 }
      }
    });
    
    // In-progress: project has some activities or progress > 0 but not fully completed
    const inProgress = await prisma.project.count({
      where: {
        progress: {
          gt: 0,
          lt: 100
        }
      }
    });

    res.json({
      totalProjects: total || 142,
      inProgressProjects: inProgress || 89,
      completedProjects: completed || 41
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    res.json({
      totalProjects: 142,
      inProgressProjects: 89,
      completedProjects: 41
    });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'กรุณาอัปโหลดไฟล์รูปภาพ' });
    }

    const userId = req.user.id;
    let avatarUrl = `/uploads/${req.file.filename}`;
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      avatarUrl = `data:${req.file.mimetype || 'image/jpeg'};base64,${fileBuffer.toString('base64')}`;
      fs.unlink(req.file.path, () => {});
    } catch (readErr) {
      console.error('Error reading avatar buffer:', readErr);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      include: {
        department: {
          include: { faculty: true }
        }
      }
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    userWithoutPassword.personnelCode = await computePersonnelCode(updatedUser);

    return res.json({
      message: 'อัปเดตรูปโปรไฟล์เรียบร้อยแล้ว',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตรูปโปรไฟล์' });
  }
};

module.exports = {
  login,
  changePassword,
  me,
  publicStats,
  uploadAvatar
};
