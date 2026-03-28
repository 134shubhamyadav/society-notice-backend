const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  purpose: { type: String, required: true },
  flatNumber: { type: String, required: true, trim: true },
  societyName: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  entryTime: { type: Date, default: Date.now },
  exitTime: { type: Date }
}, { timestamps: true });

visitorSchema.index({ societyName: 1, createdAt: -1 });

module.exports = mongoose.model('Visitor', visitorSchema);
