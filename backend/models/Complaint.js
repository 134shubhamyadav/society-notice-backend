const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, enum: ['Plumbing', 'Electrical', 'Carpentry', 'Cleaning', 'Security', 'Other'], default: 'Other' },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' },
  societyName: { type: String, required: true, trim: true },
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  residentName: { type: String, required: true },
  flatNumber: { type: String, default: '' },
  adminReply: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
