const Node = require('../models/Node');
const Workspace = require('../models/Workspace');

// Create Node
exports.createNode = async (req, res) => {
  try {
    const { title, type, workspaceId, content, position, color } = req.body;

    // Check workspace access
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Check if user is member of workspace
    const isMember = workspace.members.some(member => 
      member.user.toString() === req.userId.toString()
    );
    
    if (!isMember && workspace.owner.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to create node in this workspace' });
    }

    // Create node
    const node = new Node({
      title,
      type: type || 'note',
      content: content || {},
      owner: req.userId,
      workspace: workspaceId,
      position: position || { x: 0, y: 0, z: 0 },
      color: color || '#8b5cf6',
      permissions: {
        visibility: 'workspace',
        canView: [req.userId],
        canEdit: [req.userId],
        canManage: [req.userId]
      }
    });

    await node.save();

    // Add node to workspace
    workspace.nodes.push(node._id);
    await workspace.save();

    res.status(201).json({
      success: true,
      node
    });
  } catch (error) {
    console.error('Create node error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Node by ID
exports.getNode = async (req, res) => {
  try {
    const node = await Node.findById(req.params.id)
      .populate('owner', 'username avatar')
      .populate('workspace', 'name')
      .populate('edges.target', 'title type color');

    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    // Check permissions
    if (node.permissions.visibility === 'private' && 
        !node.permissions.canView.some(id => id.toString() === req.userId.toString())) {
      return res.status(403).json({ error: 'Not authorized to view this node' });
    }

    res.json({
      success: true,
      node
    });
  } catch (error) {
    console.error('Get node error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update Node
exports.updateNode = async (req, res) => {
  try {
    const { title, content, position, color, rings, permissions } = req.body;
    const node = await Node.findById(req.params.id);

    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    // Check edit permissions
    if (!node.permissions.canEdit.some(id => id.toString() === req.userId.toString())) {
      return res.status(403).json({ error: 'Not authorized to edit this node' });
    }

    // Update fields
    if (title !== undefined) node.title = title;
    if (content !== undefined) node.content = content;
    if (position !== undefined) node.position = position;
    if (color !== undefined) node.color = color;
    if (rings !== undefined) node.rings = rings;
    if (permissions !== undefined) node.permissions = permissions;
    
    node.lastEditedBy = req.userId;
    node.version += 1;

    await node.save();

    res.json({
      success: true,
      node
    });
  } catch (error) {
    console.error('Update node error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete Node
exports.deleteNode = async (req, res) => {
  try {
    const node = await Node.findById(req.params.id);

    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    // Check manage permissions
    if (!node.permissions.canManage.some(id => id.toString() === req.userId.toString())) {
      return res.status(403).json({ error: 'Not authorized to delete this node' });
    }

    await node.deleteOne();

    // Remove from workspace
    await Workspace.findByIdAndUpdate(node.workspace, {
      $pull: { nodes: node._id }
    });

    res.json({
      success: true,
      message: 'Node deleted successfully'
    });
  } catch (error) {
    console.error('Delete node error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add Edge (Connection)
exports.addEdge = async (req, res) => {
  try {
    const { targetId, type, label, strength } = req.body;
    const node = await Node.findById(req.params.id);

    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }

    const targetNode = await Node.findById(targetId);
    if (!targetNode) {
      return res.status(404).json({ error: 'Target node not found' });
    }

    // Check if edge already exists
    const existingEdge = node.edges.find(edge => 
      edge.target.toString() === targetId.toString()
    );

    if (existingEdge) {
      return res.status(400).json({ error: 'Edge already exists' });
    }

    // Add edge
    node.edges.push({
      target: targetId,
      type: type || 'linked',
      label: label || '',
      strength: strength || 1
    });

    await node.save();

    res.json({
      success: true,
      edge: node.edges[node.edges.length - 1]
    });
  } catch (error) {
    console.error('Add edge error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Nodes by Workspace
exports.getWorkspaceNodes = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const nodes = await Node.find({ workspace: workspaceId })
      .populate('owner', 'username avatar')
      .select('title type color position edges rings createdAt');

    res.json({
      success: true,
      nodes
    });
  } catch (error) {
    console.error('Get workspace nodes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Search Nodes
exports.searchNodes = async (req, res) => {
  try {
    const { query, workspaceId, type } = req.query;
    let searchQuery = { workspace: workspaceId };

    if (query) {
      searchQuery.$or = [
        { title: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } }
      ];
    }

    if (type) {
      searchQuery.type = type;
    }

    const nodes = await Node.find(searchQuery)
      .select('title type color position tags createdAt')
      .limit(20);

    res.json({
      success: true,
      nodes
    });
  } catch (error) {
    console.error('Search nodes error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};