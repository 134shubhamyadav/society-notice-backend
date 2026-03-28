const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'resident'], default: 'resident' },
  societyName: { type: String, required: true, trim: true },
  flatNumber: { type: String, trim: true, default: '' },
  expoPushToken: { type: String, default: null },
  acknowledgedNotices: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notice' }],
  securityKey: { type: String, default: '' },
  resetRequest: {
    status: { type: String, enum: ['None', 'Pending', 'Approved', 'Rejected'], default: 'None' },
    tempPassword: { type: String, default: '' }
  },
  gender: { type: String, default: 'Male' },
  phone: { type: String, required: true },
  personalEmail: { type: String, required: true },
  dob: { type: Date, default: null },
  showBirthdayUI: { type: Boolean, default: false },
  profileEditRequest: {
    status: { type: String, enum: ['None', 'Pending', 'Approved', 'Rejected'], default: 'None' },
    changes: { type: Object, default: null }
  },
  profileEditHistory: [{
    changes: Object,
    status: String,
    at: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
