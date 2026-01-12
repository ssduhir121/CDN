const Collaboration = require('../models/Collaboration');
const Node = require('../models/Node');

// Get Collaboration Session
exports.getCollaboration = async (req, res) => {
  try {
    const { nodeId } = req.params;
    
    let collaboration = await Collaboration.findOne({ 
      node: nodeId, 
      isActive: true 
    }).populate('users.user', 'username avatar color');

    if (!collaboration) {
      collaboration = new Collaboration({
        node: nodeId,
        users: [],
        operations: [],
        chat: []
      });
      await collaboration.save();
    }

    res.json({
      success: true,
      collaboration
    });
  } catch (error) {
    console.error('Get collaboration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Join Collaboration
exports.joinCollaboration = async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { cursorPosition, color } = req.body;

    let collaboration = await Collaboration.findOne({ 
      node: nodeId, 
      isActive: true 
    });

    if (!collaboration) {
      collaboration = new Collaboration({
        node: nodeId,
        users: [],
        operations: [],
        chat: []
      });
    }

    // Check if user already in collaboration
    const existingUser = collaboration.users.find(user => 
      user.user.toString() === req.userId.toString()
    );

    if (!existingUser) {
      collaboration.users.push({
        user: req.userId,
        cursorPosition: cursorPosition || { x: 0, y: 0 },
        selection: '',
        lastActive: new Date(),
        color: color || `#${Math.floor(Math.random()*16777215).toString(16)}`
      });
    } else {
      existingUser.lastActive = new Date();
    }

    collaboration.lastActivity = new Date();
    await collaboration.save();

    res.json({
      success: true,
      collaboration
    });
  } catch (error) {
    console.error('Join collaboration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Leave Collaboration
exports.leaveCollaboration = async (req, res) => {
  try {
    const { nodeId } = req.params;

    const collaboration = await Collaboration.findOne({ 
      node: nodeId, 
      isActive: true 
    });

    if (!collaboration) {
      return res.status(404).json({ error: 'Collaboration not found' });
    }

    // Remove user from collaboration
    collaboration.users = collaboration.users.filter(user => 
      user.user.toString() !== req.userId.toString()
    );

    collaboration.lastActivity = new Date();
    await collaboration.save();

    res.json({
      success: true,
      message: 'Left collaboration successfully'
    });
  } catch (error) {
    console.error('Leave collaboration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update Cursor Position
exports.updateCursor = async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { cursorPosition, selection } = req.body;

    const collaboration = await Collaboration.findOne({ 
      node: nodeId, 
      isActive: true 
    });

    if (!collaboration) {
      return res.status(404).json({ error: 'Collaboration not found' });
    }

    const userIndex = collaboration.users.findIndex(user => 
      user.user.toString() === req.userId.toString()
    );

    if (userIndex !== -1) {
      if (cursorPosition) {
        collaboration.users[userIndex].cursorPosition = cursorPosition;
      }
      if (selection !== undefined) {
        collaboration.users[userIndex].selection = selection;
      }
      collaboration.users[userIndex].lastActive = new Date();
    }

    collaboration.lastActivity = new Date();
    await collaboration.save();

    res.json({
      success: true,
      message: 'Cursor updated successfully'
    });
  } catch (error) {
    console.error('Update cursor error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Add Chat Message
exports.addChatMessage = async (req, res) => {
  try {
    const { nodeId } = req.params;
    const { message } = req.body;

    const collaboration = await Collaboration.findOne({ 
      node: nodeId, 
      isActive: true 
    });

    if (!collaboration) {
      return res.status(404).json({ error: 'Collaboration not found' });
    }

    collaboration.chat.push({
      user: req.userId,
      message,
      timestamp: new Date()
    });

    collaboration.lastActivity = new Date();
    await collaboration.save();

    res.json({
      success: true,
      message: 'Chat message added successfully'
    });
  } catch (error) {
    console.error('Add chat message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get Chat History
exports.getChatHistory = async (req, res) => {
  try {
    const { nodeId } = req.params;

    const collaboration = await Collaboration.findOne({ 
      node: nodeId 
    }).populate('chat.user', 'username avatar');

    if (!collaboration) {
      return res.json({
        success: true,
        chat: []
      });
    }

    res.json({
      success: true,
      chat: collaboration.chat
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};