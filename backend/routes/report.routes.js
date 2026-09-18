/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: backend/routes/report.routes.js
 * หน้าที่: เส้นทาง API สำหรับการออกรายงานและส่งออกข้อมูล (Reports & Export Data) (/api/reports)
 *          - แสดงรายงานสรุปผลการดำเนินงานยุทธศาสตร์บนหน้าเว็บ
 *          - ส่งออกข้อมูลในรูปแบบไฟล์ CSV, Excel (.xlsx), และเอกสาร PDF
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');

// GET /api/reports - ดึงข้อมูลสรุปรายงานผลตามตัวกรอง (ปีงบประมาณ, คณะ, แผนงาน)
router.get('/', authenticate, reportController.getReport);

// GET /api/reports/export/csv - ส่งออกข้อมูลรายงานสรุปโครงการในรูปแบบไฟล์ CSV
router.get('/export/csv', authenticate, reportController.exportCSV);

// GET /api/reports/export/excel - ส่งออกข้อมูลรายงานโครงการในรูปแบบ Excel (.xlsx)
router.get('/export/excel', authenticate, reportController.exportExcel);

// GET /api/reports/export/pdf - ส่งออกเอกสารสรุปโครงการในรูปแบบไฟล์ PDF
router.get('/export/pdf', authenticate, reportController.exportPDF);

// GET /api/reports/export/master-pdf - ส่งออกเอกสาร Master Data ในรูปแบบไฟล์ PDF
router.get('/export/master-pdf', authenticate, reportController.exportMasterDataPDF);

module.exports = router;
