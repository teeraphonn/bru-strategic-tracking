const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, dashboardController.getDashboardStats);
router.get('/dean', authenticate, authorize(['DEAN', 'ADMIN', 'PRESIDENT']), dashboardController.getDeanDashboardStats);
router.get('/president', authenticate, authorize(['PRESIDENT', 'ADMIN', 'DEAN']), dashboardController.getPresidentDashboardStats);

module.exports = router;
