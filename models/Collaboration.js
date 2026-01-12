const mongoose = require('mongoose');

const collaborationSchema = new mongoose.Schema({
  node: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Node',
    required: true
  },
  users: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cursorPosition: {
      x: Number,
      y: Number
    },
    selection: String,
    lastActive: Date,
    color: String
  }],
  operations: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, enum: ['insert', 'delete', 'update', 'move'] },
    data: mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now },
    version: Number
  }],
  chat: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Collaboration', collaborationSchema);