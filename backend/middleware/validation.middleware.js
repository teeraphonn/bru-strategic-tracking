/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: backend/middleware/validation.middleware.js
 * หน้าที่: มิดเดิลแวร์สำหรับตรวจสอบความถูกต้องของข้อมูลนำเข้า (Data Validation Middleware)
 *          - ใช้งาน Express-Validator ตรวจสอบ Schema ของ Body ก่อนส่งต่อให้ Controller
 *          - หากข้อมูลไม่ถูกต้อง จะส่ง HTTP 400 Bad Request พร้อมข้อความแจ้งเตือนทันที
 *          - รวมกฎการตรวจสอบข้อมูลทั้งหมดของระบบ (Login, User, Master Data, Project, Activity)
 * ============================================================================
 */

const { validationResult, body } = require('express-validator');

/**
 * ฟังก์ชัน Higher-Order สำหรับรันชุดการตรวจสอบข้อมูล
 * @param {Array} validations - รายการกฎ Validation ของ Express-Validator
 * @returns {Function} Express Middleware
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // รันการตรวจสอบทีละกฎ
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    // หากผ่านการตรวจสอบทั้งหมด ให้ทำงานต่อไป
    if (errors.isEmpty()) {
      return next();
    }

    // หากพบข้อผิดพลาด ส่งข้อความแรกที่พบกลับไปยัง Client
    const firstMsg = errors.array()[0]?.msg || 'ข้อมูลที่กรอกไม่ถูกต้องตามเงื่อนไข';
    res.status(400).json({ 
      message: firstMsg, 
      errors: errors.array() 
    });
  };
};

// ─── 1. กฎการตรวจสอบสำหรับการเข้าสู่ระบบ (Login) ───────────────────────────
const loginSchema = [
  body('username').trim().notEmpty().withMessage('กรุณากรอกชื่อผู้ใช้งาน (Username)'),
  body('password').notEmpty().withMessage('กรุณากรอกรหัสผ่าน (Password)')
];

// ─── 2. กฎการตรวจสอบสำหรับการเปลี่ยนรหัสผ่าน (Change Password) ────────────
const changePasswordSchema = [
  body('oldPassword').notEmpty().withMessage('กรุณากรอกรหัสผ่านเดิม'),
  body('newPassword')
    .isLength({ min: 6 }).withMessage('รหัสผ่านใหม่ต้องยาวอย่างน้อย 6 ตัวอักษร')
];

// ─── 3. กฎการตรวจสอบข้อมูลผู้ใช้งานระบบ (User Account) ──────────────────────
const userSchema = [
  body('username').trim().notEmpty().withMessage('กรุณากรอกชื่อเข้าใช้ระบบ (Username)'),
  body('name').trim().notEmpty().withMessage('กรุณากรอกชื่อ-นามสกุลจริง'),
  body('role').isIn(['ADMIN', 'TEACHER', 'DEAN', 'PRESIDENT']).withMessage('บทบาทระบบไม่ถูกต้อง'),
  body('departmentId').optional({ nullable: true }),
  body('password').optional({ checkFalsy: true })
    .isLength({ min: 6 }).withMessage('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร')
];

// ─── 4. กฎการตรวจสอบข้อมูลคณะ/หน่วยงานหลัก (Faculty) ───────────────────────
const facultySchema = [
  body('name').trim().notEmpty().withMessage('Faculty name is required')
];

// ─── 5. กฎการตรวจสอบข้อมูลภาควิชา/สาขาวิชา (Department) ────────────────────
const departmentSchema = [
  body('name').trim().notEmpty().withMessage('Department name is required'),
  body('facultyId').optional({ nullable: true })
];

// ─── 6. กฎการตรวจสอบปีงบประมาณ (Fiscal Year) ──────────────────────────────
const fiscalYearSchema = [
  body('year').isInt({ min: 2500, max: 3000 }).withMessage('Year must be between 2500 and 3000'),
  body('active').optional().isBoolean().withMessage('Active status must be boolean')
];

// ─── 7. กฎการตรวจสอบแหล่งงบประมาณ (Budget Source) ────────────────────────
const budgetSourceSchema = [
  body('name').trim().notEmpty().withMessage('Budget source name is required')
];

// ─── 8. กฎการตรวจสอบประเด็นยุทธศาสตร์ (Strategy) ─────────────────────────
const strategySchema = [
  body('name').trim().notEmpty().withMessage('Strategy name is required'),
  body('code').trim().notEmpty().withMessage('Strategy code is required')
];

// ─── 9. กฎการตรวจสอบแผนงานย่อย/กลยุทธ์ (Sub-Strategy) ─────────────────────
const subStrategySchema = [
  body('name').trim().notEmpty().withMessage('Sub-strategy name is required'),
  body('code').trim().notEmpty().withMessage('Sub-strategy code is required'),
  body('strategyId').isInt().withMessage('Strategy ID must be integer')
];

// ─── 10. กฎการตรวจสอบตัวชี้วัด/โครงการหลัก (Strategic Indicator) ─────────
const indicatorSchema = [
  body('name').trim().notEmpty().withMessage('Indicator name is required'),
  body('code').trim().notEmpty().withMessage('Indicator code is required'),
  body('subStrategyId').isInt().withMessage('Sub-strategy ID must be integer')
];

// ─── 11. กฎการตรวจสอบการสร้างและแก้ไขโครงการ (Project Proposal) ───────────
const projectSchema = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('fiscalYearId').isInt().withMessage('Fiscal Year ID must be integer'),
  body('budgetSourceId').isInt().withMessage('Budget Source ID must be integer'),
  body('subStrategyId').isInt().withMessage('Sub-strategy ID must be integer'),
  body('indicatorId').optional({ nullable: true }).isInt().withMessage('Indicator ID must be integer'),
  body('totalBudget').isFloat({ min: 0 }).withMessage('Total budget must be a positive number'),
  body('targetCount').isInt({ min: 1 }).withMessage('Target count must be at least 1'),
  body('unit').trim().notEmpty().withMessage('Unit is required (e.g. ครั้ง, รุ่น)'),
  body('startDate').isISO8601().toDate().withMessage('Valid start date is required'),
  body('endDate').isISO8601().toDate().withMessage('Valid end date is required'),
  body('userIds').optional().isArray().withMessage('Assigned users must be an array of integers')
];

// ─── 12. กฎการตรวจสอบการสร้างกิจกรรมย่อย (Project Activity) ───────────────
const activitySchema = [
  body('name').trim().notEmpty().withMessage('Activity name is required'),
  body('activityDate').isISO8601().toDate().withMessage('Valid activity date is required'),
  body('budget').isFloat({ min: 0 }).withMessage('Budget must be a positive number')
];

// ─── 13. กฎการตรวจสอบการรายงานผลและเบิกจ่าย (Progress Tracking) ───────────
const progressTrackingSchema = [
  body('actualBudget').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Actual budget must be a positive number'),
  body('success').optional().isBoolean().withMessage('Success must be boolean'),
  body('completedCount').optional().isInt({ min: 0 }).withMessage('Completed count must be non-negative'),
  body('remark').optional({ nullable: true }).trim()
];

module.exports = {
  validate,
  loginSchema,
  changePasswordSchema,
  userSchema,
  facultySchema,
  departmentSchema,
  fiscalYearSchema,
  budgetSourceSchema,
  strategySchema,
  subStrategySchema,
  indicatorSchema,
  projectSchema,
  activitySchema,
  progressTrackingSchema
};
