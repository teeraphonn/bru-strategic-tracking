const express = require('express');
const router = express.Router();
const issueController = require('../controllers/issue.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Public to all logged in users
router.post('/', authenticate, issueController.createIssue);
router.get('/my', authenticate, issueController.getMyIssues);
router.get('/notifications', authenticate, issueController.getNotifications);

// Admin only routes
router.get('/', authenticate, authorize(['ADMIN']), issueController.getAllIssues);
router.patch('/:id', authenticate, authorize(['ADMIN']), issueController.updateIssue);
router.delete('/:id', authenticate, authorize(['ADMIN']), issueController.deleteIssue);

module.exports = router;
