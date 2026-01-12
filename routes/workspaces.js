const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const workspaceController = require('../controllers/workspaceController');

// All routes require authentication
router.use(authMiddleware);

// Workspace CRUD
router.post('/', workspaceController.createWorkspace);
router.get('/', workspaceController.getUserWorkspaces);
router.get('/:id', workspaceController.getWorkspace);
router.put('/:id', workspaceController.updateWorkspace);

// Member management
router.post('/:id/members', workspaceController.addMember);
router.delete('/:id/members', workspaceController.removeMember);

module.exports = router;