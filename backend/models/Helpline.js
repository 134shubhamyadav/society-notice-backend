const mongoose = require('mongoose');

const helplineSchema = new mongoose.Schema({
  societyName: { type: String, required: true },
  category: { type: String, required: true },
  icon: { type: String, default: 'call' },
  color: { type: String, default: '#4361EE' },
  contacts: [{
    name: { type: String, required: true },
    phone: { type: String, required: true },
    desk: { type: String, default: '' }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Helpline', helplineSchema);
