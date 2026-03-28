const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const { Expo } = require('expo-server-sdk');
let expo = new Expo();

// Push notification helper
async function sendPushToSociety(societyName, headline, isImportant, excludeUserId) {
  try {
    const residents = await User.find({
      societyName,
      expoPushToken: { $ne: null },
      _id: { $ne: excludeUserId }
    });

    const messages = [];
    for (const resident of residents) {
      if (!Expo.isExpoPushToken(resident.expoPushToken)) continue;
      messages.push({
        to: resident.expoPushToken,
        sound: 'default',
        title: isImportant ? '🔴 IMPORTANT Notice' : '📢 New Notice',
        body: headline,
        data: { societyName },
        priority: isImportant ? 'high' : 'default',
        channelId: isImportant ? 'important' : 'default'
      });
    }

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (err) {
    console.error('Push notification error:', err.message);
  }
}

// GET /api/notices — LIFO order
router.get('/', protect, async (req, res) => {
  try {
    // Auto-expire notices
    await Notice.updateMany(
      { societyName: req.user.societyName, status: 'active', expiryDate: { $lt: new Date() } },
      { $set: { status: 'expired', archivedAt: new Date() } }
    );

    const notices = await Notice.find({ societyName: req.user.societyName, status: 'active' })
      .populate('postedBy', 'name email role gender')
      .sort({ createdAt: -1 })
      .lean();

    const processedNotices = notices.map(notice => {
      // Safety check for acknowledgements
      const ackList = Array.isArray(notice.acknowledgedBy) ? notice.acknowledgedBy : [];
      const hasAcknowledged = req.user ? ackList.some(
        a => a.user && a.user.toString() === req.user._id.toString()
      ) : false;

      return {
        ...notice,
        hasAcknowledged,
        postedByName: notice.postedBy ? notice.postedBy.name : (notice.postedByName || 'System'),
        postedByRole: notice.postedBy ? notice.postedBy.role : 'admin'
      };
    });

    // Remove the potentially large array before sending to frontend
    processedNotices.forEach(n => delete n.acknowledgedBy);

    res.json({ success: true, count: processedNotices.length, data: processedNotices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/notices/bookmarks — Optimized fetch
router.get('/bookmarks', protect, async (req, res) => {
  try {
    const userWithBookmarks = await User.findById(req.user._id)
      .populate({
        path: 'bookmarks',
        match: { status: 'active' }, // Only show active notices
        options: { sort: { createdAt: -1 } }
      });
    
    if (!userWithBookmarks) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, count: userWithBookmarks.bookmarks.length, data: userWithBookmarks.bookmarks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// GET /api/notices/trash
router.get('/trash', protect, adminOnly, async (req, res) => {
  try {
    // Auto-delete after 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await Notice.deleteMany({ societyName: req.user.societyName, archivedAt: { $lt: thirtyDaysAgo } });

    const notices = await Notice.find({ 
      societyName: req.user.societyName, 
      status: { $in: ['deleted', 'expired'] } 
    }).sort({ archivedAt: -1 }).lean();

    res.json({ success: true, count: notices.length, data: notices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/notices/trash/:id/restore
router.put('/trash/:id/restore', protect, adminOnly, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    if (notice.societyName !== req.user.societyName)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    notice.status = 'active';
    notice.archivedAt = null;
    if (notice.expiryDate && new Date(notice.expiryDate) < new Date()) {
      notice.expiryDate = null;
    }
    await notice.save();
    res.json({ success: true, message: 'Notice restored', data: notice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/notices/trash/:id/permanent
router.delete('/trash/:id/permanent', protect, adminOnly, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    if (notice.societyName !== req.user.societyName)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    await notice.deleteOne();
    res.json({ success: true, message: 'Notice permanently deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/notices/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id).populate('postedBy', 'name email role gender');
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    if (notice.societyName !== req.user.societyName)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const ackList = Array.isArray(notice.acknowledgedBy) ? notice.acknowledgedBy : [];
    const hasAcknowledged = ackList.some(
      a => a.user && a.user.toString() === req.user._id.toString()
    );

    res.json({ success: true, data: { ...notice.toObject(), hasAcknowledged } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/notices — Pure JSON string layout
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { headline, body, category, isImportant, expiryDate, externalLink } = req.body;
    if (!headline || !body)
      return res.status(400).json({ success: false, message: 'Headline and body are required' });

    const notice = await Notice.create({
      headline,
      body,
      category: category || 'General',
      isImportant: isImportant === 'true' || isImportant === true,
      isPoll: req.body.isPoll === 'true' || req.body.isPoll === true,
      pollOptions: req.body.pollOptions ? JSON.parse(req.body.pollOptions).map(opt => ({ text: opt })) : [],
      societyName: req.user.societyName,
      postedBy: req.user._id,
      postedByName: req.user.name,
      expiryDate: expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year if not provided
      externalLink: externalLink || null,
      attachment: null
    });

    await sendPushToSociety(req.user.societyName, headline, isImportant, req.user._id);

    res.status(201).json({ success: true, data: notice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/notices/sos — Emergency Panic Generation
router.post('/sos', protect, async (req, res) => {
  try {
    const headline = `🚨 SOS EMERGENCY 🚨`;
    const body = `URGENT ALERT: Emergency triggered by ${req.user.name} (Flat: ${req.user.flatNumber || 'Unknown'}). Please check immediately!`;

    const notice = await Notice.create({
      headline,
      body,
      category: 'Security',
      isImportant: true,
      societyName: req.user.societyName,
      postedBy: req.user._id,
      postedByName: req.user.name || 'Resident',
      expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Trigger push notifications in background
    sendPushToSociety(req.user.societyName, headline, true, null).catch(err => {
        console.error('[SOS] Push failed:', err.message);
    });

    console.log(`[SOS] SUCCESS: Panic Alert created for society: ${req.user.societyName}`);
    res.status(201).json({ success: true, message: 'SOS Panic Alerts triggered globally!', data: notice });
  } catch (err) {
    console.error(`[SOS] FATAL ERROR: ${err.message}`, err.stack);
    res.status(500).json({ success: false, message: `Server Error: ${err.message}` });
  }
});

// POST /api/notices/:id/bookmark
router.post('/:id/bookmark', protect, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

    const bookmarkId = notice._id.toString();
    const bookmarks = (req.user.bookmarks || []).map(id => id.toString());
    const index = bookmarks.indexOf(bookmarkId);
    
    if (index === -1) {
      req.user.bookmarks.push(notice._id);
    } else {
      req.user.bookmarks.splice(index, 1);
    }
    
    await req.user.save();
    res.json({ success: true, isBookmarked: req.user.bookmarks.map(id => id.toString()).includes(bookmarkId), bookmarks: req.user.bookmarks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/notices/:id (Edit Notice)
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { headline, body, category, isImportant, expiryDate, isPoll, pollOptions, externalLink } = req.body;
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    if (notice.societyName !== req.user.societyName)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    notice.headline = headline || notice.headline;
    notice.body = body || notice.body;
    notice.category = category || notice.category;
    notice.isImportant = isImportant !== undefined ? (isImportant === 'true' || isImportant === true) : notice.isImportant;
    notice.expiryDate = expiryDate || notice.expiryDate;
    notice.externalLink = externalLink || notice.externalLink;
    
    // Once a poll is created, we don't allow changing isPoll or pollOptions easily to avoid data inconsistency
    // But for simplicity in this project, we'll allow it if no votes are cast.
    if (isPoll !== undefined && (notice.pollOptions.every(opt => opt.votes.length === 0))) {
        notice.isPoll = isPoll === 'true' || isPoll === true;
        if (pollOptions) {
            notice.pollOptions = JSON.parse(pollOptions).map(opt => ({ text: opt }));
        }
    }

    await notice.save();
    res.json({ success: true, message: 'Notice updated', data: notice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/notices/:id (Soft Delete)
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    if (notice.societyName !== req.user.societyName)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    notice.status = 'deleted';
    notice.archivedAt = new Date();
    await notice.save();
    res.json({ success: true, message: 'Notice deleted (moved to trash)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/notices/:id/acknowledge
router.post('/:id/acknowledge', protect, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

    const ackList = Array.isArray(notice.acknowledgedBy) ? notice.acknowledgedBy : [];
    const alreadyAcked = ackList.some(
      a => a.user && a.user.toString() === req.user._id.toString()
    );
    if (alreadyAcked)
      return res.json({ success: true, message: 'Already acknowledged' });

    if (!Array.isArray(notice.acknowledgedBy)) notice.acknowledgedBy = [];
    notice.acknowledgedBy.push({ user: req.user._id, name: req.user.name });
    await notice.save();

    res.json({ success: true, message: 'Notice acknowledged', count: notice.acknowledgedBy.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/notices/:id/ack-list
router.get('/:id/ack-list', protect, adminOnly, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    const ackList = Array.isArray(notice.acknowledgedBy) ? notice.acknowledgedBy : [];
    res.json({ success: true, data: ackList, total: ackList.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/notices/:id/vote
router.post('/:id/vote', protect, async (req, res) => {
  try {
    const { optionId } = req.body;
    const notice = await Notice.findById(req.params.id);
    if (!notice || !notice.isPoll) return res.status(400).json({ success: false, message: 'Invalid poll notice' });

    const alreadyVoted = notice.pollOptions.some(opt => opt.votes.includes(req.user._id));
    if (alreadyVoted) return res.status(400).json({ success: false, message: 'You have already voted' });

    const option = notice.pollOptions.id(optionId);
    if (!option) return res.status(400).json({ success: false, message: 'Invalid option' });
    
    option.votes.push(req.user._id);
    await notice.save();
    
    res.json({ success: true, message: 'Vote recorded', data: notice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/notices/:id/comment
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ success: false, message: 'Comment cannot be empty' });

    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

    notice.comments.push({
      user: req.user._id,
      name: req.user.name,
      text: text.trim(),
    });
    
    await notice.save();
    res.json({ success: true, message: 'Comment added', data: notice.comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;