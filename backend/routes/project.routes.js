/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: backend/routes/project.routes.js
 * หน้าที่: เส้นทาง API สำหรับบริหารจัดการโครงการตามยุทธศาสตร์ (/api/projects)
 *          - รองรับการเสนอโครงการใหม่ (CRUD)
 *          - ตรวจสอบสิทธิ์การเข้าถึงและการแก้ไขตามสังกัดของผู้ใช้
 *          - บันทึกข้อสั่งการของผู้บริหาร (Executive Directives)
 *          - สลับสถานะล็อก/ปลดล็อกโครงการเพื่อป้องกันการลบโดยไม่ได้รับอนุญาต
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate, projectSchema } = require('../middleware/validation.middleware');

// POST /api/projects - สร้างข้อเสนอโครงการใหม่ (ผ่านการตรวจ projectSchema)
router.post('/', authenticate, validate(projectSchema), projectController.createProject);

// GET /api/projects - ดึงรายการโครงการแบบแบ่งหน้า (Pagination) พร้อมระบบค้นหาและตัวกรอง
router.get('/', authenticate, projectController.getProjects);

// GET /api/projects/:id - ดึงข้อมูลรายละเอียดของโครงการหนึ่งๆ พร้อมกิจกรรมและความเชื่อมโยงยุทธศาสตร์
router.get('/:id', authenticate, projectController.getProject);

// PUT /api/projects/:id - แก้ไขข้อมูลโครงการ (ตรวจสิทธิ์ผู้รับผิดชอบ หรือ Admin)
router.put('/:id', authenticate, validate(projectSchema), projectController.updateProject);

// POST /api/projects/:id/directive - บันทึกข้อสั่งการ/คำแนะนำของผู้บริหาร (DEAN, PRESIDENT, ADMIN)
router.post('/:id/directive', authenticate, authorize(['DEAN', 'PRESIDENT', 'ADMIN']), projectController.updateExecutiveDirective);

// PATCH /api/projects/:id/toggle-lock - สลับสถานะล็อกโครงการ (เฉพาะ ADMIN ป้องกันการลบข้อมูลโดยพลการ)
router.patch('/:id/toggle-lock', authenticate, authorize(['ADMIN']), projectController.toggleProjectLock);

// DELETE /api/projects/:id - ลบโครงการ (ต้องอยู่ในสถานะปลดล็อก หรือลบโดย Admin)
router.delete('/:id', authenticate, projectController.deleteProject);

module.exports = router;
