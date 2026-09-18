/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: backend/middleware/upload.middleware.js
 * หน้าที่: มิดเดิลแวร์สำหรับจัดการการอัปโหลดไฟล์รูปภาพด้วย Multer (File Upload Handling)
 *          - กำหนดโฟลเดอร์ปลายทางสำหรับจัดเก็บไฟล์ (backend/uploads/)
 *          - สร้างชื่อไฟล์แบบไม่ซ้ำกัน (Timestamp + Random Suffix) เพื่อป้องกันชื่อไฟล์ชนกัน
 *          - กรองประเภทไฟล์: อนุญาตเฉพาะรูปภาพนามสกุล .jpg, .jpeg, .png
 *          - จำกัดขนาดไฟล์ไม่เกิน 5 MB ต่อไฟล์ เพื่อป้องกันพื้นที่เซิร์ฟเวอร์เต็ม
 * ============================================================================
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── 1. ตรวจสอบโฟลเดอร์ uploads และสร้างขึ้นมาใหม่หากยังไม่มี ──────────────
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ─── 2. กำหนดพื้นที่จัดเก็บไฟล์และรูปแบบการตั้งชื่อไฟล์บนดิสก์ ─────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // สุ่มตัวเลขและเวลาเพื่อสร้างชื่อไฟล์ที่ไม่ซ้ำกัน
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// ─── 3. กรองประเภทไฟล์ที่อนุญาตให้อัปโหลด (MIME Type & Extension Filter) ───
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('รองรับเฉพาะไฟล์รูปภาพนามสกุล JPG, JPEG และ PNG เท่านั้น!'), false);
  }
};

// ─── 4. รวมการตั้งค่าทั้งหมดเป็น Multer Upload Instance ───────────────────
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // จำกัดขนาดไม่เกิน 5 MB ต่อภาพ
  fileFilter: fileFilter
});

module.exports = upload;
