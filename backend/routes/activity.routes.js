/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: backend/routes/activity.routes.js
 * หน้าที่: เส้นทาง API สำหรับจัดการกิจกรรมย่อยของโครงการและการรายงานผล (/api/activities)
 *          - เพิ่มและแก้ไขกิจกรรมย่อย
 *          - อัปโหลดภาพถ่ายหลักฐานความสำเร็จ (รองรับสูงสุด 10 รูป ขนาดไม่เกิน 5 MB/รูป)
 *          - รายงานความก้าวหน้า ผลผลิต ยอดเงินเบิกจ่ายจริง
 *          - สลับสถานะล็อก/ปลดล็อกกิจกรรม และลบรูปภาพหลักฐาน
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const { validate, activitySchema, progressTrackingSchema } = require('../middleware/validation.middleware');

// GET /api/activities - ดึงรายการกิจกรรมทั้งหมด (รองรับ Filter ตามโครงการ และแบ่งหน้า)
router.get('/', authenticate, activityController.getActivities);

// POST /api/activities - สร้างกิจกรรมย่อยใหม่ภายใต้โครงการ (ผ่านการตรวจ activitySchema)
router.post('/', authenticate, validate(activitySchema), activityController.createActivity);

/**
 * มิดเดิลแวร์จัดการอัปโหลดรูปภาพหลายไฟล์ (Multiple Images Upload Handler)
 * - ดักจับ Error กรณีไฟล์ใหญ่เกิน 5 MB หรืออัปโหลดเกิน 10 รูป
 */
const uploadImagesMiddleware = (req, res, next) => {
  upload.array('images', 10)(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          message: 'ขนาดไฟล์รูปภาพใหญ่เกินขีดจำกัด! อนุญาตเฉพาะไฟล์ขนาดไม่เกิน 5 MB ต่อรูป'
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          message: 'จำนวนรูปภาพมากเกินขีดจำกัด! สามารถอัปโหลดได้สูงสุดครั้งละไม่เกิน 10 รูป'
        });
      }
      return res.status(400).json({
        message: err.message || 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์รูปภาพ'
      });
    }
    next();
  });
};

// PUT /api/activities/:id - อัปเดตข้อมูลกิจกรรมและรายงานผลความก้าวหน้า
router.put('/:id', authenticate, uploadImagesMiddleware, validate(progressTrackingSchema), activityController.updateActivity);

// PUT /api/activities/:id/progress - บันทึกผลความก้าวหน้าและอัปโหลดภาพหลักฐานเพิ่มเติม
router.put('/:id/progress', authenticate, uploadImagesMiddleware, validate(progressTrackingSchema), activityController.updateActivity);

// POST /api/activities/:id/report - รายงานผลการดำเนินกิจกรรมแบบทางการ
router.post('/:id/report', authenticate, uploadImagesMiddleware, validate(progressTrackingSchema), activityController.updateActivity);

// PATCH /api/activities/:id/toggle-lock - สลับสถานะล็อกกิจกรรม (เฉพาะ ADMIN)
router.patch('/:id/toggle-lock', authenticate, authorize(['ADMIN']), activityController.toggleActivityLock);

// DELETE /api/activities/images/:imageId - ลบรูปภาพหลักฐานความสำเร็จรายรูป
router.delete('/images/:imageId', authenticate, activityController.deleteActivityImage);

// DELETE /api/activities/:id - ลบกิจกรรมย่อยออกจากระบบ (พร้อมลบรูปภาพที่เกี่ยวข้อง)
router.delete('/:id', authenticate, activityController.deleteActivity);

module.exports = router;
