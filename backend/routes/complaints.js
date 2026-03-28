const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/complaints
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, category } = req.body;
    if (!title || !description) return res.status(400).json({ success: false, message: 'Title and description required' });

    const complaint = await Complaint.create({
      title, description, category: category || 'Other',
      societyName: req.user.societyName,
      resident: req.user._id, residentName: req.user.name, flatNumber: req.user.flatNumber
    });
    res.status(201).json({ success: true, data: complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/complaints
router.get('/', protect, async (req, res) => {
  try {
    let query = { societyName: req.user.societyName };
    if (req.user.role === 'resident') query.resident = req.user._id;

    const complaints = await Complaint.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: complaints.length, data: complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/complaints/:id (Admin reply/status update)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status, adminReply } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    if (complaint.societyName !== req.user.societyName) return res.status(403).json({ success: false, message: 'Not authorized' });

    if (status) complaint.status = status;
    if (adminReply !== undefined) complaint.adminReply = adminReply;

    await complaint.save();
    res.json({ success: true, data: complaint });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
