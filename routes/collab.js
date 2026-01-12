const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const collaborationController = require('../controllers/collaborationController');

// All routes require authentication
router.use(authMiddleware);

// Collaboration sessions
router.get('/:nodeId', collaborationController.getCollaboration);
router.post('/:nodeId/join', collaborationController.joinCollaboration);
router.post('/:nodeId/leave', collaborationController.leaveCollaboration);
router.put('/:nodeId/cursor', collaborationController.updateCursor);

// Chat
router.get('/:nodeId/chat', collaborationController.getChatHistory);
router.post('/:nodeId/chat', collaborationController.addChatMessage);

module.exports = router;