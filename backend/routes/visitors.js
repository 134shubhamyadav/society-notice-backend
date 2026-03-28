const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/visitors - Security/Admin records a visitor
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { name, phone, purpose, flatNumber } = req.body;
    if (!name || !phone || !flatNumber) return res.status(400).json({ success: false, message: 'Missing fields' });

    const visitor = await Visitor.create({
      name, phone, purpose: purpose || 'General Visit', flatNumber,
      societyName: req.user.societyName, status: 'Approved' // Pre-approved by security
    });

    res.status(201).json({ success: true, data: visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/visitors - Get visitors for society (Admin) or specific flat (Resident)
router.get('/', protect, async (req, res) => {
  try {
    let query = { societyName: req.user.societyName };
    if (req.user.role === 'resident') query.flatNumber = req.user.flatNumber;

    const visitors = await Visitor.find(query).sort({ entryTime: -1 });
    res.json({ success: true, count: visitors.length, data: visitors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
