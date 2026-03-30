const mongoose = require('mongoose');

const societySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  city: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Society', societySchema);
