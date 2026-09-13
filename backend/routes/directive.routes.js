const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// POST /api/directives/dean
router.post('/dean', authenticate, authorize(['DEAN', 'ADMIN']), (req, res, next) => {
  if (req.body.projectId) {
    req.params.id = req.body.projectId;
  }
  return projectController.updateExecutiveDirective(req, res, next);
});

// POST /api/directives/president
router.post('/president', authenticate, authorize(['PRESIDENT', 'ADMIN']), (req, res, next) => {
  if (req.body.projectId) {
    req.params.id = req.body.projectId;
  }
  return projectController.updateExecutiveDirective(req, res, next);
});

module.exports = router;
