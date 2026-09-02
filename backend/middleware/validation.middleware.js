const { validationResult, body } = require('express-validator');

const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ errors: errors.array() });
  };
};

// Define shared validation rules
const loginSchema = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const changePasswordSchema = [
  body('oldPassword').notEmpty().withMessage('Old password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร (New password must be at least 8 characters long)')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('รหัสผ่านต้องประกอบด้วยพิมพ์เล็ก พิมพ์ใหญ่ ตัวเลข และสัญลักษณ์พิเศษอย่างละอย่างน้อย 1 ตัว (Password must include uppercase, lowercase, numbers, and symbols)')
];

const userSchema = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('name').trim().notEmpty().withMessage('Full name is required'),
  body('role').isIn(['ADMIN', 'TEACHER', 'DEAN', 'PRESIDENT']).withMessage('Invalid role'),
  body('departmentId').optional({ nullable: true }),
  body('password').optional({ checkFalsy: true })
    .isLength({ min: 8 }).withMessage('รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร (Password must be at least 8 characters long)')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('รหัสผ่านต้องประกอบด้วยพิมพ์เล็ก พิมพ์ใหญ่ ตัวเลข และสัญลักษณ์พิเศษอย่างละอย่างน้อย 1 ตัว (Password must include uppercase, lowercase, numbers, and symbols)')
];

const facultySchema = [
  body('name').trim().notEmpty().withMessage('Faculty name is required')
];

const departmentSchema = [
  body('name').trim().notEmpty().withMessage('Department name is required'),
  body('facultyId').optional({ nullable: true })
];

const fiscalYearSchema = [
  body('year').isInt({ min: 2500, max: 3000 }).withMessage('Year must be between 2500 and 3000'),
  body('active').optional().isBoolean().withMessage('Active status must be boolean')
];

const budgetSourceSchema = [
  body('name').trim().notEmpty().withMessage('Budget source name is required')
];

const strategySchema = [
  body('name').trim().notEmpty().withMessage('Strategy name is required'),
  body('code').trim().notEmpty().withMessage('Strategy code is required')
];

const subStrategySchema = [
  body('name').trim().notEmpty().withMessage('Sub-strategy name is required'),
  body('code').trim().notEmpty().withMessage('Sub-strategy code is required'),
  body('strategyId').isInt().withMessage('Strategy ID must be integer')
];

const indicatorSchema = [
  body('name').trim().notEmpty().withMessage('Indicator name is required'),
  body('code').trim().notEmpty().withMessage('Indicator code is required'),
  body('subStrategyId').isInt().withMessage('Sub-strategy ID must be integer')
];

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

const activitySchema = [
  body('name').trim().notEmpty().withMessage('Activity name is required'),
  body('activityDate').isISO8601().toDate().withMessage('Valid activity date is required'),
  body('budget').isFloat({ min: 0 }).withMessage('Budget must be a positive number')
];

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
