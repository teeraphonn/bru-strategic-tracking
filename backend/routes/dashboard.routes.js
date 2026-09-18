/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: backend/routes/dashboard.routes.js
 * หน้าที่: เส้นทาง API สำหรับดึงข้อมูลสรุปสถิติแดชบอร์ดตามระดับบทบาท (/api/dashboard)
 *          - สรุปภาพรวมสำหรับผู้ใช้ทั่วไป/อาจารย์ผู้รับผิดชอบโครงการ
 *          - แดชบอร์ดระดับคณะสำหรับคณบดี (Dean)
 *          - แดชบอร์ดยุทธศาสตร์มหาวิทยาลัยสำหรับอธิการบดี/ผู้บริหารระดับสูง (President & Executive)
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// GET /api/dashboard - สถิติภาพรวมพื้นฐานสำหรับ Dashboard ของอาจารย์และเจ้าหน้าที่
router.get('/', authenticate, dashboardController.getDashboardStats);

// GET /api/dashboard/executive - สถิติสำหรับผู้บริหารระดับสูง (President, Admin, Dean)
router.get('/executive', authenticate, authorize(['PRESIDENT', 'ADMIN', 'DEAN']), dashboardController.getPresidentDashboardStats);

// GET /api/dashboard/dean - สถิติกำกับติดตามระดับคณะ (เฉพาะโครงการในคณะของคณบดีท่านนั้น)
router.get('/dean', authenticate, authorize(['DEAN', 'ADMIN', 'PRESIDENT']), dashboardController.getDeanDashboardStats);

// GET /api/dashboard/president - สถิติภาพรวมยุทธศาสตร์ทั้งมหาวิทยาลัย (ทุกคณะ, คอขวดโครงการ, Matrix)
router.get('/president', authenticate, authorize(['PRESIDENT', 'ADMIN', 'DEAN']), dashboardController.getPresidentDashboardStats);

module.exports = router;
