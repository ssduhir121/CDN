const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const nodeController = require('../controllers/nodeController');

// All routes require authentication
router.use(authMiddleware);

// CRUD operations
router.post('/', nodeController.createNode);
router.get('/search', nodeController.searchNodes);
router.get('/workspace/:workspaceId', nodeController.getWorkspaceNodes);
router.get('/:id', nodeController.getNode);
router.put('/:id', nodeController.updateNode);
router.delete('/:id', nodeController.deleteNode);

// Edge operations
router.post('/:id/edges', nodeController.addEdge);

module.exports = router;