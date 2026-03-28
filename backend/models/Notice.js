const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  headline: { type: String, required: true, trim: true, maxlength: 120 },
  body: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['Water', 'Electricity', 'Maintenance', 'Meeting', 'Election', 'Security', 'General', 'Other'],
    default: 'General'
  },
  // Only HIGH importance flag
  isImportant: { type: Boolean, default: false },
  isPoll: { type: Boolean, default: false },
  pollOptions: [{
    text: { type: String, required: true },
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],
  societyName: { type: String, required: true, trim: true },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  postedByName: { type: String },
  expiryDate: { type: Date, required: false },
  externalLink: { type: String },
  acknowledgedBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    at: { type: Date, default: Date.now }
  }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ['active', 'deleted', 'expired'], default: 'active' },
  archivedAt: { type: Date, default: null }
}, {
  timestamps: true  // createdAt = upload date; sorted LIFO (newest first)
});

// Compound index: society + newest first
noticeSchema.index({ societyName: 1, createdAt: -1 });

module.exports = mongoose.model('Notice', noticeSchema);
