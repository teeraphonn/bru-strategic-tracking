/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: backend/config/prisma.js
 * หน้าที่: จุดเชื่อมต่อฐานข้อมูลหลักผ่าน Prisma ORM Client (Database Connection Instance)
 *          - ทำหน้าที่เป็น Singleton Client เชื่อมต่อฐานข้อมูล MySQL
 *          - กำหนดระดับ Logging ตามสภาพแวดล้อม (development แสดง warn, error)
 *          - ใช้จัดการคิวรี ตารางความสัมพันธ์ (Relations) และ Transactions ทั้งหมดในระบบ
 * ============================================================================
 */

const { PrismaClient } = require('@prisma/client');

// สร้างอินสแตนซ์ PrismaClient พร้อมตั้งค่าระดับการบันทึก Log
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;
