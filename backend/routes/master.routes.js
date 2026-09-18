/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: backend/routes/master.routes.js
 * หน้าที่: เส้นทาง API สำหรับบริหารจัดการข้อมูลพื้นฐานทั้ง 9 ตาราง (Master Data)
 *          - ผู้ใช้งานที่ Login ทุกคนสามารถดึงข้อมูล (GET) ไปแสดงผลใน Dropdown ต่างๆ ได้
 *          - การเพิ่ม แก้ไข ลบ (POST, PUT, DELETE) สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (ADMIN) เท่านั้น
 * ============================================================================
 */

const express = require('express');
const router = express.Router();
const masterController = require('../controllers/master.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  validate,
  userSchema,
  facultySchema,
  departmentSchema,
  fiscalYearSchema,
  budgetSourceSchema,
  strategySchema,
  subStrategySchema,
  indicatorSchema
} = require('../middleware/validation.middleware');

// ─── 1. เส้นทางดึงข้อมูลพื้นฐาน (Read-Only: สำหรับผู้ใช้ที่ผ่านการ Login) ─────
router.get('/faculties', authenticate, masterController.getFaculties);           // รายชื่อคณะทั้งหมด
router.get('/departments', authenticate, masterController.getDepartments);       // รายชื่อภาควิชา/สาขาวิชาทั้งหมด
router.get('/local-issues', authenticate, masterController.getLocalIssues);     // ประเด็นการพัฒนาท้องถิ่น
router.get('/fiscal-years', authenticate, masterController.getFiscalYears);     // รายการปีงบประมาณ
router.get('/budget-sources', authenticate, masterController.getBudgetSources); // รายการแหล่งเงินงบประมาณ
router.get('/strategies', authenticate, masterController.getStrategies);         // แผนงานหลัก
router.get('/sub-strategies', authenticate, masterController.getSubStrategies); // แผนงานย่อย
router.get('/indicators', authenticate, masterController.getIndicators);         // โครงการหลัก / ตัวชี้วัด
router.get('/users', authenticate, masterController.getUsers);                   // รายชื่อบุคลากรผู้ใช้งาน

// ─── 2. เส้นทางจัดการข้อมูลพื้นฐาน (Admin Writes Only) ────────────────────────

// 2.1 ประเด็นการพัฒนาท้องถิ่น (Local Issues)
router.post('/local-issues', authenticate, authorize('ADMIN'), masterController.createLocalIssue);
router.put('/local-issues/:id', authenticate, authorize('ADMIN'), masterController.updateLocalIssue);
router.delete('/local-issues/:id', authenticate, authorize('ADMIN'), masterController.deleteLocalIssue);

// 2.2 คณะและหน่วยงานหลัก (Faculties)
router.post('/faculties', authenticate, authorize('ADMIN'), validate(facultySchema), masterController.createFaculty);
router.put('/faculties/:id', authenticate, authorize('ADMIN'), validate(facultySchema), masterController.updateFaculty);
router.delete('/faculties/:id', authenticate, authorize('ADMIN'), masterController.deleteFaculty);

// 2.3 ภาควิชาและสาขาวิชา (Departments)
router.post('/departments', authenticate, authorize('ADMIN'), validate(departmentSchema), masterController.createDepartment);
router.put('/departments/:id', authenticate, authorize('ADMIN'), validate(departmentSchema), masterController.updateDepartment);
router.delete('/departments/:id', authenticate, authorize('ADMIN'), masterController.deleteDepartment);

// 2.4 ปีงบประมาณ (Fiscal Years)
router.post('/fiscal-years', authenticate, authorize('ADMIN'), validate(fiscalYearSchema), masterController.createFiscalYear);
router.put('/fiscal-years/:id', authenticate, authorize('ADMIN'), validate(fiscalYearSchema), masterController.updateFiscalYear);
router.delete('/fiscal-years/:id', authenticate, authorize('ADMIN'), masterController.deleteFiscalYear);

// 2.5 แหล่งงบประมาณ (Budget Sources)
router.post('/budget-sources', authenticate, authorize('ADMIN'), validate(budgetSourceSchema), masterController.createBudgetSource);
router.put('/budget-sources/:id', authenticate, authorize('ADMIN'), validate(budgetSourceSchema), masterController.updateBudgetSource);
router.delete('/budget-sources/:id', authenticate, authorize('ADMIN'), masterController.deleteBudgetSource);

// 2.6 แผนงานหลัก (Strategies)
router.post('/strategies', authenticate, authorize('ADMIN'), validate(strategySchema), masterController.createStrategy);
router.put('/strategies/:id', authenticate, authorize('ADMIN'), validate(strategySchema), masterController.updateStrategy);
router.delete('/strategies/:id', authenticate, authorize('ADMIN'), masterController.deleteStrategy);

// 2.7 แผนงานย่อย (Sub Strategies)
router.post('/sub-strategies', authenticate, authorize('ADMIN'), validate(subStrategySchema), masterController.createSubStrategy);
router.put('/sub-strategies/:id', authenticate, authorize('ADMIN'), validate(subStrategySchema), masterController.updateSubStrategy);
router.delete('/sub-strategies/:id', authenticate, authorize('ADMIN'), masterController.deleteSubStrategy);

// 2.8 โครงการหลัก / ตัวชี้วัด (Indicators)
router.post('/indicators', authenticate, authorize('ADMIN'), validate(indicatorSchema), masterController.createIndicator);
router.put('/indicators/:id', authenticate, authorize('ADMIN'), validate(indicatorSchema), masterController.updateIndicator);
router.delete('/indicators/:id', authenticate, authorize('ADMIN'), masterController.deleteIndicator);

// 2.9 บัญชีผู้ใช้งานระบบ (User Accounts & Password Management)
router.post('/users', authenticate, authorize('ADMIN'), validate(userSchema), masterController.createUser);
router.put('/users/:id', authenticate, authorize('ADMIN'), validate(userSchema), masterController.updateUser);
router.delete('/users/:id', authenticate, authorize('ADMIN'), masterController.deleteUser);
router.post('/users/:id/reset-password', authenticate, authorize('ADMIN'), masterController.resetUserPassword);

// 2.10 เครื่องมือตรวจสอบระบบและการดูแลรักษา (System Health & Maintenance)
router.get('/system/health', authenticate, authorize('ADMIN'), masterController.getSystemHealth);
router.post('/system/clear-cache', authenticate, authorize('ADMIN'), masterController.clearCache);

module.exports = router;
