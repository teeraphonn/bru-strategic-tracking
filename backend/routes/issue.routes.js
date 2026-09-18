/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: backend/routes/issue.routes.js
 * หน้าที่: เส้นทาง API สำหรับระบบรับแจ้งปัญหาการใช้งานและศูนย์ช่วยเหลือ (/api/issues)
 *          - ผู้ใช้งานทุกคนสามารถเปิด Ticket แจ้งปัญหา และดูประวัติการแจ้งของตนเองได้
 *          - ผู้ดูแลระบบ (ADMIN) จัดการเรื่องร้องเรียน ตอบกลับ อัปเดตสถานะ และลบรายการ
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issue.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// ─── 1. เส้นทางสำหรับผู้ใช้งานทั่วไป (All Authenticated Users) ──────────────────
// POST /api/issues - ส่งแบบฟอร์มแจ้งปัญหาการใช้งานระบบใหม่
router.post('/', authenticate, issueController.createIssue);

// GET /api/issues/my - ดึงรายการปัญหาที่ผู้ใช้คนปัจจุบันเคยส่งเรื่องไว้
router.get('/my', authenticate, issueController.getMyIssues);

// GET /api/issues/notifications - ดึงรายการแจ้งเตือนการตอบกลับปัญหา
router.get('/notifications', authenticate, issueController.getNotifications);

// ─── 2. เส้นทางสำหรับผู้ดูแลระบบ (Admin Only) ─────────────────────────────────
// GET /api/issues - ดึงรายการปัญหาทั้งหมดในระบบ พร้อมตัวกรองสถานะ (PENDING, RESOLVED)
router.get('/', authenticate, authorize(['ADMIN']), issueController.getAllIssues);

// PATCH /api/issues/:id - อัปเดตสถานะปัญหา (เช่น IN_PROGRESS, RESOLVED) และบันทึกคำตอบกลับจาก Admin
router.patch('/:id', authenticate, authorize(['ADMIN']), issueController.updateIssue);

// DELETE /api/issues/:id - ลบรายการแจ้งปัญหาออกจากระบบ
router.delete('/:id', authenticate, authorize(['ADMIN']), issueController.deleteIssue);

module.exports = router;
