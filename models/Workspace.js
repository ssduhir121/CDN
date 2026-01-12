const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { 
      type: String, 
      enum: ['owner', 'admin', 'member', 'viewer'], 
      default: 'member' 
    },
    joinedAt: { type: Date, default: Date.now }
  }],
  nodes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Node'
  }],
  settings: {
    theme: {
      type: String,
      default: 'galaxy'
    },
    defaultPermissions: {
      visibility: { type: String, default: 'workspace' },
      canInvite: { type: Boolean, default: true }
    },
    integrations: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

workspaceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Workspace', workspaceSchema);