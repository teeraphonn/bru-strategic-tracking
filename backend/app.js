/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: backend/app.js
 * หน้าที่: จุดเริ่มต้นหลักของเซิร์ฟเวอร์ Express (Main Entry Point)
 *          - ตั้งค่า Middlewares ด้านความปลอดภัย (Helmet, CORS, Rate Limit)
 *          - ตั้งค่า Logger (Morgan) และ Body Parser (JSON, URL-Encoded)
 *          - กำหนดโฟลเดอร์สำหรับให้บริการไฟล์ภาพ Static (/uploads)
 *          - ลงทะเบียน Routing หลักทั้งหมดของระบบ (/api/...)
 *          - ระบบจัดการข้อผิดพลาดกลาง (Global Error Handling & 404 Not Found)
 * ============================================================================
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// โหลดค่าตัวแปรสภาพแวดล้อมจากไฟล์ .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── 1. ตรวจสอบและสร้างโฟลเดอร์สำหรับอัปโหลดไฟล์หากยังไม่มี ───────────────
const uploadDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'uploads', 'activities'),
  path.join(__dirname, 'uploads', 'avatars')
];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ─── 2. ตั้งค่าความปลอดภัยพื้นฐานด้วย Helmet ────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: false, // อนุญาตให้ดึง Resource ข้าม Origin ได้ (สำหรับภาพใน /uploads)
}));

// ─── 3. ตั้งค่า CORS (Cross-Origin Resource Sharing) ───────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://localhost:5000'
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.indexOf(origin) !== -1 ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.netlify.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// ─── 4. ระบบป้องกันการส่งคำขอกระหน่ำ (Rate Limiting) ────────────────────
// ป้องกันการยิง API ทั่วไป: 1,000 ครั้ง ต่อ 15 นาที ต่อ 1 IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api/', limiter);

// ป้องกัน Brute-force สำหรับ Endpoint สำคัญ (Login และเปลี่ยนรหัสผ่าน): 20 ครั้ง ต่อ 15 นาที
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'ท่านทำธุรกรรมบ่อยเกินไป กรุณารองดเว้นและลองใหม่อีกครั้งใน 15 นาที (Too many auth attempts, please try again after 15 minutes)' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/change-password', authLimiter);

// ─── 5. แปลงข้อมูลคำขอ (Request Parsing & Logging) ──────────────────────
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev')); // บันทึก Log การเรียก API ลงคอนโซล

// ─── 6. ให้บริการไฟล์ภาพสถิต (Static Assets: Uploads) ───────────────────
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// ─── 7. ลงทะเบียนเส้นทางหลักของ API (API Routes Registration) ───────────
app.use('/api/auth', require('./routes/auth.routes'));             // เส้นทางยืนยันตัวตน, Login, ข้อมูลส่วนตัว
app.use('/api/master', require('./routes/master.routes'));         // เส้นทางจัดการข้อมูลพื้นฐาน (Master Data)
app.use('/api/projects', require('./routes/project.routes'));       // เส้นทางจัดการโครงการยุทธศาสตร์ (CRUD, Lock)
app.use('/api/activities', require('./routes/activity.routes'));   // เส้นทางบันทึกกิจกรรมและอัปโหลดรูปภาพ
app.use('/api/dashboard', require('./routes/dashboard.routes'));     // เส้นทางสรุปข้อมูลสถิติแดชบอร์ด
app.use('/api/directives', require('./routes/directive.routes'));   // เส้นทางข้อสั่งการของผู้บริหาร
app.use('/api/reports', require('./routes/report.routes'));         // เส้นทางรายงานสรุปภาพรวมและวิเคราะห์ผล
app.use('/api/issues', require('./routes/issue.routes'));           // เส้นทางแจ้งปัญหาการใช้งานระบบ

// ─── 8. Health Check Endpoint สำหรับตรวจสอบสถานะเซิร์ฟเวอร์ ─────────────
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// ─── 9. ดักจับเส้นทางที่ไม่พบ (404 Not Found Handler) ───────────────────
app.use((req, res, next) => {
  res.status(404).json({ message: `Route ${req.method} ${req.url} not found` });
});

// ─── 10. ระบบจัดการข้อผิดพลาดระดับเซิร์ฟเวอร์ (Global Error Handler) ──────
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ─── 11. เริ่มเปิดเซิร์ฟเวอร์รับการเชื่อมต่อ (Start Listening) ────────────
app.listen(PORT, () => {
  console.log(`[SERVER] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = app;
