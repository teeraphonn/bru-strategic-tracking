/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: backend/routes/directive.routes.js
 * หน้าที่: เส้นทาง API สำหรับการบันทึกข้อสั่งการของผู้บริหาร (Executive Directives) (/api/directives)
 *          - รองรับการสั่งการระดับคณะโดยคณบดี (Dean Directive)
 *          - รองรับการสั่งการระดับมหาวิทยาลัยโดยอธิการบดี (President Directive)
 *          - นำส่งคำขอต่อไปยัง updateExecutiveDirective ใน project.controller
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// POST /api/directives/dean - บันทึกข้อสั่งการของคณบดีต่อโครงการในคณะ
router.post('/dean', authenticate, authorize(['DEAN', 'ADMIN']), (req, res, next) => {
  if (req.body.projectId) {
    req.params.id = req.body.projectId;
  }
  return projectController.updateExecutiveDirective(req, res, next);
});

// POST /api/directives/president - บันทึกข้อสั่งการของอธิการบดีต่อโครงการใดๆ ในมหาวิทยาลัย
router.post('/president', authenticate, authorize(['PRESIDENT', 'ADMIN']), (req, res, next) => {
  if (req.body.projectId) {
    req.params.id = req.body.projectId;
  }
  return projectController.updateExecutiveDirective(req, res, next);
});

module.exports = router;
