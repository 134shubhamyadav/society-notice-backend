const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Society = require('../models/Society');
const Support = require('../models/Support');
const { protect } = require('../middleware/auth');

// Middleware to ensure user is a developer (via role OR verified email)
const devOnly = (req, res, next) => {
  const isDev = req.user && (req.user.role === 'developer' || req.user.email?.endsWith('@societysphere.com'));
  if (isDev) return next();
  return res.status(403).json({ success: false, message: 'Developer access required' });
};

// --- Society Management ---
router.get('/societies', protect, devOnly, async (req, res) => {
  try {
    const societies = await Society.find().sort({ name: 1 });
    res.json({ success: true, data: societies });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/societies', protect, devOnly, async (req, res) => {
  try {
    const { name, city, state } = req.body;
    if (!name || !city || !state) return res.status(400).json({ success: false, message: 'Name, City and State required' });
    const society = await Society.create({ name, city, state });
    res.status(201).json({ success: true, data: society });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/societies/:id', protect, devOnly, async (req, res) => {
  try {
    await Society.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Society removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Support Tickets ---
router.get('/support-tickets', protect, devOnly, async (req, res) => {
  try {
    const tickets = await Support.find().sort({ createdAt: -1 });
    res.json({ success: true, data: tickets });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/support-tickets/:id', protect, devOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await Support.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- User Interaction ---
router.post('/contact-support', protect, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });
    
    const ticket = await Support.create({
      userId: req.user._id,
      name: req.user.name,
      email: req.user.email,
      message
    });
    
    res.status(201).json({ success: true, message: 'Support request sent successfully!', data: ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Developer Testing Tools ---
router.put('/switch-context', protect, devOnly, async (req, res) => {
  try {
    const { role, societyName } = req.body;
    if (!role || !societyName) return res.status(400).json({ success: false, message: 'Role and societyName required' });
    
    const user = await User.findByIdAndUpdate(req.user._id, { role, societyName }, { new: true });
    res.json({ success: true, message: `Context switched to ${role} @ ${societyName}`, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
