const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['note', 'task', 'document', 'collection', 'media', 'project', 'idea'],
    required: true,
    default: 'note'
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workspace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 }
  },
  color: {
    type: String,
    default: '#8b5cf6'
  },
  size: {
    type: Number,
    default: 1,
    min: 0.5,
    max: 3
  },
  rings: [{
    type: {
      type: String,
      enum: ['tasks', 'files', 'chat', 'calendar', 'commerce', 'analytics']
    },
    data: mongoose.Schema.Types.Mixed,
    isActive: { type: Boolean, default: true }
  }],
  edges: [{
    target: { type: mongoose.Schema.Types.ObjectId, ref: 'Node' },
    type: { 
      type: String, 
      enum: ['child', 'parent', 'depends', 'references', 'linked', 'owns'] 
    },
    label: String,
    strength: { type: Number, default: 1, min: 0, max: 10 }
  }],
  permissions: {
    visibility: { 
      type: String, 
      enum: ['public', 'private', 'workspace'], 
      default: 'workspace' 
    },
    canView: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    canEdit: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    canManage: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
  },
  lastEditedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

// Update timestamp before saving
nodeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Node', nodeSchema);