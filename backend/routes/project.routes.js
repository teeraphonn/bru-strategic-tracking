const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate, projectSchema } = require('../middleware/validation.middleware');

router.post('/', authenticate, validate(projectSchema), projectController.createProject);
router.get('/', authenticate, projectController.getProjects);
router.get('/:id', authenticate, projectController.getProject);
router.put('/:id', authenticate, validate(projectSchema), projectController.updateProject);
router.post('/:id/directive', authenticate, authorize(['DEAN', 'PRESIDENT', 'ADMIN']), projectController.updateExecutiveDirective);
router.patch('/:id/toggle-lock', authenticate, authorize(['ADMIN']), projectController.toggleProjectLock);
router.delete('/:id', authenticate, projectController.deleteProject);

module.exports = router;
