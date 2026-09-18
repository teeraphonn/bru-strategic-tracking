/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: backend/config/cloudinary.js
 * หน้าที่: กำหนดค่าการเชื่อมต่อบริการคลาวด์จัดเก็บรูปภาพ Cloudinary SDK
 *          - รองรับการอัปโหลดรูปภาพกิจกรรม และรูปภาพโปรไฟล์ขึ้นสู่ Cloud Storage
 *          - ดึงการตั้งค่า (Cloud Name, API Key, API Secret) จากไฟล์ .env
 * ============================================================================
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// กำหนดข้อมูลการยืนยันตัวตนสำหรับ Cloudinary API
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'x676nxoa',
  api_key: process.env.CLOUDINARY_API_KEY || '761253354223237',
  api_secret: process.env.CLOUDINARY_API_SECRET || '6k_Q2eg_YYJlMe7tUOWulj4GI5I'
});

module.exports = cloudinary;
