/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: backend/routes/auth.routes.js
 * หน้าที่: เส้นทาง API สำหรับระบบยืนยันตัวตนและจัดการบัญชีผู้ใช้ (/api/auth)
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, loginSchema, changePasswordSchema } = require('../middleware/validation.middleware');
const upload = require('../middleware/upload.middleware');

// POST /api/auth/login - เข้าสู่ระบบด้วย Username & Password (ผ่านการตรวจสอบ loginSchema)
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/change-password - เปลี่ยนรหัสผ่านของตนเอง (ต้อง Login ก่อน + ผ่าน changePasswordSchema)
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);

// POST /api/auth/avatar - อัปโหลดรูปภาพประจำตัว (ต้อง Login ก่อน + อัปโหลดผ่าน upload.single('avatar'))
router.post('/avatar', authenticate, upload.single('avatar'), authController.uploadAvatar);

// GET /api/auth/me - ดึงข้อมูลโปรไฟล์ของผู้ใช้ปัจจุบันที่กำลัง Login อยู่
router.get('/me', authenticate, authController.me);

// GET /api/auth/public-stats - ดึงสถิติภาพรวมสำหรับแสดงที่หน้า Login สาธารณะ (ไม่ต้อง Login)
router.get('/public-stats', authController.publicStats);

module.exports = router;
