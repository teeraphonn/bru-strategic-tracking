const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', authenticate, reportController.getReport);
router.get('/export/csv', authenticate, reportController.exportCSV);
router.get('/export/excel', authenticate, reportController.exportExcel);
router.get('/export/pdf', authenticate, reportController.exportPDF);
router.get('/export/master-pdf', authenticate, reportController.exportMasterDataPDF);

module.exports = router;
