const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const { validate, activitySchema, progressTrackingSchema } = require('../middleware/validation.middleware');

router.get('/', authenticate, activityController.getActivities);
router.post('/', authenticate, validate(activitySchema), activityController.createActivity);

// Supports multipart form for file uploads and progress text tracking fields
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

router.put('/:id', authenticate, uploadImagesMiddleware, validate(progressTrackingSchema), activityController.updateActivity);
router.put('/:id/progress', authenticate, uploadImagesMiddleware, validate(progressTrackingSchema), activityController.updateActivity);

router.patch('/:id/toggle-lock', authenticate, authorize(['ADMIN']), activityController.toggleActivityLock);
router.delete('/images/:imageId', authenticate, activityController.deleteActivityImage);
router.delete('/:id', authenticate, activityController.deleteActivity);

module.exports = router;
