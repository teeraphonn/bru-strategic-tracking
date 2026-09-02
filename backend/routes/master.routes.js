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

// Public reads (Any authenticated user can fetch master data to populate dropdowns)
router.get('/faculties', authenticate, masterController.getFaculties);
router.get('/departments', authenticate, masterController.getDepartments);
router.get('/fiscal-years', authenticate, masterController.getFiscalYears);
router.get('/budget-sources', authenticate, masterController.getBudgetSources);
router.get('/strategies', authenticate, masterController.getStrategies);
router.get('/sub-strategies', authenticate, masterController.getSubStrategies);
router.get('/indicators', authenticate, masterController.getIndicators);
router.get('/users', authenticate, masterController.getUsers);

// Restrictive writes (ADMIN role only)
// Faculties
router.post('/faculties', authenticate, authorize('ADMIN'), validate(facultySchema), masterController.createFaculty);
router.put('/faculties/:id', authenticate, authorize('ADMIN'), validate(facultySchema), masterController.updateFaculty);
router.delete('/faculties/:id', authenticate, authorize('ADMIN'), masterController.deleteFaculty);

// Departments
router.post('/departments', authenticate, authorize('ADMIN'), validate(departmentSchema), masterController.createDepartment);
router.put('/departments/:id', authenticate, authorize('ADMIN'), validate(departmentSchema), masterController.updateDepartment);
router.delete('/departments/:id', authenticate, authorize('ADMIN'), masterController.deleteDepartment);

// Fiscal Years
router.post('/fiscal-years', authenticate, authorize('ADMIN'), validate(fiscalYearSchema), masterController.createFiscalYear);
router.put('/fiscal-years/:id', authenticate, authorize('ADMIN'), validate(fiscalYearSchema), masterController.updateFiscalYear);
router.delete('/fiscal-years/:id', authenticate, authorize('ADMIN'), masterController.deleteFiscalYear);

// Budget Sources
router.post('/budget-sources', authenticate, authorize('ADMIN'), validate(budgetSourceSchema), masterController.createBudgetSource);
router.put('/budget-sources/:id', authenticate, authorize('ADMIN'), validate(budgetSourceSchema), masterController.updateBudgetSource);
router.delete('/budget-sources/:id', authenticate, authorize('ADMIN'), masterController.deleteBudgetSource);

// Strategies
router.post('/strategies', authenticate, authorize('ADMIN'), validate(strategySchema), masterController.createStrategy);
router.put('/strategies/:id', authenticate, authorize('ADMIN'), validate(strategySchema), masterController.updateStrategy);
router.delete('/strategies/:id', authenticate, authorize('ADMIN'), masterController.deleteStrategy);

// Sub Strategies
router.post('/sub-strategies', authenticate, authorize('ADMIN'), validate(subStrategySchema), masterController.createSubStrategy);
router.put('/sub-strategies/:id', authenticate, authorize('ADMIN'), validate(subStrategySchema), masterController.updateSubStrategy);
router.delete('/sub-strategies/:id', authenticate, authorize('ADMIN'), masterController.deleteSubStrategy);

// Indicators
router.post('/indicators', authenticate, authorize('ADMIN'), validate(indicatorSchema), masterController.createIndicator);
router.put('/indicators/:id', authenticate, authorize('ADMIN'), validate(indicatorSchema), masterController.updateIndicator);
router.delete('/indicators/:id', authenticate, authorize('ADMIN'), masterController.deleteIndicator);

// Users
router.post('/users', authenticate, authorize('ADMIN'), validate(userSchema), masterController.createUser);
router.put('/users/:id', authenticate, authorize('ADMIN'), validate(userSchema), masterController.updateUser);
router.delete('/users/:id', authenticate, authorize('ADMIN'), masterController.deleteUser);
router.post('/users/:id/reset-password', authenticate, authorize('ADMIN'), masterController.resetUserPassword);

// System Health & Maintenance Tools
router.get('/system/health', authenticate, authorize('ADMIN'), masterController.getSystemHealth);
router.post('/system/clear-cache', authenticate, authorize('ADMIN'), masterController.clearCache);

module.exports = router;
