const Workspace = require('../models/Workspace');
const Node = require('../models/Node');
const User = require('../models/User');

// Create Workspace
exports.createWorkspace = async (req, res) => {
  try {
    const { name, description, tags } = req.body;

    const workspace = new Workspace({
      name,
      description: description || '',
      owner: req.userId,
      members: [{
        user: req.userId,
        role: 'owner'
      }],
      tags: tags || []
    });

    await workspace.save();

    // Add workspace to user's workspaces
    await User.findByIdAndUpdate(req.userId, {
      $push: { workspaces: workspace._id }
    });

    res.status(201).json({
      success: true,
      workspace
    });
  } catch (error) {
    console.error('Create workspace error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Workspace by ID
exports.getWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'username avatar')
      .populate('members.user', 'username avatar email');

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Check if user is member
    const isMember = workspace.members.some(member => 
      member.user._id.toString() === req.userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized to access this workspace' });
    }

    res.json({
      success: true,
      workspace
    });
  } catch (error) {
    console.error('Get workspace error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get User's Workspaces
exports.getUserWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      'members.user': req.userId,
      isActive: true
    })
    .populate('owner', 'username avatar')
    .select('name description members nodes settings.createdAt');

    res.json({
      success: true,
      workspaces
    });
  } catch (error) {
    console.error('Get user workspaces error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update Workspace
exports.updateWorkspace = async (req, res) => {
  try {
    const { name, description, settings, tags } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Check if user is owner or admin
    const userRole = workspace.members.find(member => 
      member.user.toString() === req.userId.toString()
    );

    if (!userRole || !['owner', 'admin'].includes(userRole.role)) {
      return res.status(403).json({ error: 'Not authorized to update workspace' });
    }

    // Update fields
    if (name) workspace.name = name;
    if (description !== undefined) workspace.description = description;
    if (settings) workspace.settings = { ...workspace.settings, ...settings };
    if (tags) workspace.tags = tags;

    await workspace.save();

    res.json({
      success: true,
      workspace
    });
  } catch (error) {
    console.error('Update workspace error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add Member to Workspace
exports.addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Check if user can invite
    const inviterRole = workspace.members.find(member => 
      member.user.toString() === req.userId.toString()
    );

    if (!inviterRole || !['owner', 'admin'].includes(inviterRole.role)) {
      return res.status(403).json({ error: 'Not authorized to add members' });
    }

    // Check if user is already a member
    const existingMember = workspace.members.find(member => 
      member.user.toString() === userId.toString()
    );

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member' });
    }

    // Add member
    workspace.members.push({
      user: userId,
      role: role || 'member'
    });

    await workspace.save();

    // Add workspace to user's workspaces
    await User.findByIdAndUpdate(userId, {
      $push: { workspaces: workspace._id }
    });

    res.json({
      success: true,
      message: 'Member added successfully'
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Remove Member from Workspace
exports.removeMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }

    // Check if user can remove members
    const removerRole = workspace.members.find(member => 
      member.user.toString() === req.userId.toString()
    );

    if (!removerRole || !['owner', 'admin'].includes(removerRole.role)) {
      return res.status(403).json({ error: 'Not authorized to remove members' });
    }

    // Cannot remove owner
    if (workspace.owner.toString() === userId.toString()) {
      return res.status(400).json({ error: 'Cannot remove workspace owner' });
    }

    // Remove member
    workspace.members = workspace.members.filter(member => 
      member.user.toString() !== userId.toString()
    );

    await workspace.save();

    // Remove workspace from user's workspaces
    await User.findByIdAndUpdate(userId, {
      $pull: { workspaces: workspace._id }
    });

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};