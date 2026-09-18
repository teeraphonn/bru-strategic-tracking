/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: backend/middleware/auth.middleware.js
 * หน้าที่: มิดเดิลแวร์สำหรับระบบความปลอดภัยและการควบคุมการเข้าถึง (Authentication & RBAC)
 *          1. authenticate: ตรวจสอบความถูกต้องของ JWT Bearer Token และดึงข้อมูลผู้ใช้จาก DB
 *             (ใช้กลไก Dynamic Secret ผูกกับ Password Hash เพื่อบังคับ Logout อัตโนมัติเมื่อเปลี่ยนรหัสผ่าน)
 *          2. authorize: ตรวจสอบสิทธิ์การเข้าถึงตามบทบาทผู้ใช้ (Role-Based Access Control: RBAC)
 *             รองรับบทบาท ADMIN, PRESIDENT, DEAN, TEACHER
 * ============================================================================
 */

const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

/**
 * มิดเดิลแวร์ตรวจสอบ JWT Token (Authentication Guard)
 * - ดึง Token จาก Authorization Header รูปแบบ 'Bearer <token>'
 * - ตรวจสอบว่าผู้ใช้มีตัวตนอยู่ในฐานข้อมูล และยังไม่ถูกลบ/ปิดใช้งาน
 * - ตรวจสอบความถูกต้องของ Token ด้วย Secret Key + Password Hash
 * - แนบข้อมูล user (พร้อม department และ faculty) เข้ากับ req.user เพื่อให้ Controller ใช้ต่อ
 */
const authenticate = async (req, res, next) => {
  try {
    // ─── 1. ตรวจสอบว่ามีการแนบ Authorization Header หรือไม่ ─────────────────
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    // ─── 2. ถอดรหัสโครงสร้าง Token เพื่อหา User ID ─────────────────────────
    const token = authHeader.split(' ')[1];
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // ─── 3. ดึงข้อมูลผู้ใช้งานจากฐานข้อมูลพร้อมหน่วยงานที่สังกัด ─────────────
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        department: {
          include: { faculty: true }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found or disabled' });
    }

    // ─── 4. ยืนยัน Token ลับด้วย Secret + Password Hash ─────────────────────
    // หากผู้ใช้เปลี่ยนรหัสผ่าน Token เดิมจะหมดอายุทันทีโดยอัตโนมัติ
    jwt.verify(token, process.env.JWT_SECRET + user.password);

    // แนบข้อมูลผู้ใช้เข้ากับ Request Object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

/**
 * มิดเดิลแวร์ตรวจสอบสิทธิ์ตามบทบาท (Role-Based Access Control - RBAC)
 * @param {string|string[]} roles - รายชื่อบทบาทที่อนุญาตให้เข้าถึง เช่น ['ADMIN', 'PRESIDENT']
 * @returns {Function} Express Middleware
 */
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  return (req, res, next) => {
    // ตรวจสอบว่าผ่านการ Authenticate แล้วหรือไม่
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    // ตรวจสอบว่า Role ของผู้ใช้ตรงกับบทบาทที่ได้รับอนุญาตหรือไม่
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};
