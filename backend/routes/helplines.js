const express = require('express');
const router = express.Router();
const Helpline = require('../models/Helpline');
const { protect, adminOnly } = require('../middleware/auth');

// @route   GET /api/helplines
// @desc    Get all helplines for the society
router.get('/', protect, async (req, res) => {
  try {
    const helplines = await Helpline.find({ societyName: req.user.societyName });
    res.json({ success: true, count: helplines.length, data: helplines });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/helplines
// @desc    Create a new helpline category
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { category, icon, color, contacts } = req.body;
    const helpline = await Helpline.create({
      societyName: req.user.societyName,
      category,
      icon,
      color,
      contacts: contacts || []
    });
    res.status(201).json({ success: true, data: helpline });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/helplines/:id
// @desc    Update a helpline category or contacts
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { category, icon, color, contacts } = req.body;
    const helpline = await Helpline.findById(req.params.id);
    if (!helpline) return res.status(404).json({ success: false, message: 'Helpline not found' });
    if (helpline.societyName !== req.user.societyName)
      return res.status(403).json({ success: false, message: 'Not authorized for this society' });

    helpline.category = category || helpline.category;
    helpline.icon = icon || helpline.icon;
    helpline.color = color || helpline.color;
    helpline.contacts = contacts || helpline.contacts;

    await helpline.save();
    res.json({ success: true, data: helpline });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/helplines/:id
// @desc    Delete a helpline category
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const helpline = await Helpline.findById(req.params.id);
    if (!helpline) return res.status(404).json({ success: false, message: 'Helpline not found' });
    if (helpline.societyName !== req.user.societyName)
      return res.status(403).json({ success: false, message: 'Not authorized for this society' });

    await helpline.deleteOne();
    res.json({ success: true, message: 'Helpline Category removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/helplines/reset
// @desc    Seed default helplines for the society
router.post('/reset', protect, adminOnly, async (req, res) => {
  try {
    // Clear existing
    await Helpline.deleteMany({ societyName: req.user.societyName });

    const defaults = [
      {
        societyName: req.user.societyName,
        category: 'Security & Gate',
        icon: 'shield-half',
        color: '#4361EE',
        contacts: [
          { name: 'Main Security Gate', phone: '0221234567', desk: 'Intercom: 101' },
          { name: 'Night Shift Guard', phone: '9876543210', desk: 'Direct' },
        ]
      },
      {
        societyName: req.user.societyName,
        category: 'Society Maintenance',
        icon: 'construct',
        color: '#2A9D8F',
        contacts: [
          { name: 'Electrician (Ramesh)', phone: '9820011223', desk: '9 AM - 7 PM' },
          { name: 'Plumber (Suresh)', phone: '9820044556', desk: 'On Call' },
        ]
      },
      {
        societyName: req.user.societyName,
        category: 'Admin & Office',
        icon: 'business',
        color: '#3A0CA3',
        contacts: [
          { name: 'Society Manager', phone: '9911223344', desk: 'Building A, Ground' },
        ]
      },
      {
        societyName: req.user.societyName,
        category: 'Emergency Services',
        icon: 'medical',
        color: '#E63946',
        contacts: [
          { name: 'Nearby Hospital (Lifecare)', phone: '0224433221', desk: 'Ext 9' },
          { name: 'Police / Fire', phone: '100', desk: 'Emergency' },
        ]
      }
    ];

    await Helpline.insertMany(defaults);
    res.json({ success: true, message: 'Default helplines restored!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

