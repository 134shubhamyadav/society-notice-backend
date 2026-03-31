const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const ADMIN_SECRET_KEY = 'SOCIETY@ADMIN2024';

const genToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, societyName, flatNumber, adminKey, securityKey, gender, phone, personalEmail, dob } = req.body;
    if (!name || !email || !password || !societyName || !gender || !phone || !personalEmail || !dob)
      return res.status(400).json({ success: false, message: 'All fields including DOB are required' });

    // Check Max 4 users per flat
    if (role !== 'admin' && flatNumber) {
      const flatCount = await User.countDocuments({ societyName, flatNumber });
      if (flatCount >= 4) {
        return res.status(400).json({ success: false, message: 'Maximum 4 users allowed per flat' });
      }
    }

    if (role === 'admin') {
      if (!adminKey || adminKey !== ADMIN_SECRET_KEY) {
        return res.status(403).json({ success: false, message: 'Invalid admin secret key! Contact your society manager.' });
      }
      if (!securityKey) {
        return res.status(400).json({ success: false, message: 'A personal Security Key is required for Admin password recovery.' });
      }
    }

    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const isDev = role === 'developer';
    const isAdmin = role === 'admin';
    const isApproved = isAdmin || isDev; // Admins and Devs are auto-approved for now

    const user = await User.create({ 
      name, email, password, role: role || 'resident', societyName, flatNumber, 
      securityKey: securityKey || '', gender, phone, personalEmail, dob,
      isApproved: isApproved,
      isDeveloper: isDev // Set permanent flag
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id, name: user.name, email: user.email,
        role: user.role, societyName: user.societyName,
        isApproved: user.isApproved,
        flatNumber: user.flatNumber, gender: user.gender,
        phone: user.phone, personalEmail: user.personalEmail,
        dob: user.dob, token: genToken(user._id)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    res.json({
      success: true,
      data: {
        _id: user._id, name: user.name, email: user.email,
        role: user.role, societyName: user.societyName,
        isApproved: user.isApproved,
        flatNumber: user.flatNumber, gender: user.gender,
        phone: user.phone, personalEmail: user.personalEmail,
        dob: user.dob, token: genToken(user._id)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/push-token', protect, async (req, res) => {
  try {
    const { expoPushToken } = req.body;
    await User.findByIdAndUpdate(req.user._id, { expoPushToken });
    res.json({ success: true, message: 'Push token saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/me', protect, async (req, res) => {
  res.json({ success: true, data: req.user });
});


// GET SOCIETY DIRECTORY
router.get('/directory', protect, async (req, res) => {
  try {
    const users = await User.find({ 
      societyName: req.user.societyName,
      isDeveloper: { $ne: true } // Use permanent flag to filter
    })
      .select('name email role flatNumber gender')
      .sort({ flatNumber: 1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// RESIDENT: Submit a password reset request to Admin
router.post('/forgot-password-resident', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email, role: 'resident' });
    if (!user) return res.status(404).json({ success: false, message: 'Resident account not found' });
    
    user.resetRequest = { status: 'Pending', tempPassword: newPassword };
    await user.save();
    res.json({ success: true, message: 'Password reset request sent to Admin.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN: Get all pending password resets
router.get('/password-requests', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
    const requests = await User.find({ societyName: req.user.societyName, 'resetRequest.status': 'Pending' })
      .select('name email flatNumber resetRequest');
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN: Approve a resident password request
router.post('/approve-password/:userId', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
    const user = await User.findById(req.params.userId);
    if (!user || !user.resetRequest || user.resetRequest.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Invalid or missing request' });
    }
    
    // Override hash
    user.password = user.resetRequest.tempPassword;
    user.resetRequest = { status: 'Approved', tempPassword: '' };
    await user.save();
    res.json({ success: true, message: 'Resident password successfully updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN: Self-recover password via Security Key
router.post('/forgot-password-admin', async (req, res) => {
  try {
    const { email, securityKey, newPassword } = req.body;
    const user = await User.findOne({ email, role: 'admin' });
    if (!user) return res.status(404).json({ success: false, message: 'Admin account not found' });
    if (!user.securityKey || user.securityKey !== securityKey) {
      return res.status(401).json({ success: false, message: 'Invalid Security Key' });
    }
    
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Admin password successfully recovered and updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// RESIDENT: Request profile edit
router.post('/request-profile-edit', protect, async (req, res) => {
  console.log('[PROFILE] Update request received:', req.body);
  try {
    const { name, flatNumber, gender, phone, personalEmail, dob, showBirthdayUI } = req.body;
    
    // 1. Fetch current user
    const user = await User.findById(req.user._id);
    if (!user) {
      console.error('[PROFILE] User not found during update');
      return res.status(404).json({ success: false, message: 'User not found in database.' });
    }

    // 2. Prepare changes logic
    const hasFlatChange = flatNumber && flatNumber !== user.flatNumber;
    
    // 3. Apply immediate updates
    if (name) user.name = name;
    if (gender) user.gender = gender;
    if (phone !== undefined) user.phone = String(phone);
    if (personalEmail !== undefined) user.personalEmail = String(personalEmail);
    if (showBirthdayUI !== undefined) user.showBirthdayUI = Boolean(showBirthdayUI);
    
    // Handle DOB carefully
    if (dob) {
      const parsedDate = new Date(dob);
      if (!isNaN(parsedDate.getTime())) {
        user.dob = parsedDate;
      }
    }

    // 4. Handle Flat Number (Admin approval needed)
    let status = 'Immediate';
    if (hasFlatChange) {
      status = 'Pending';
      user.profileEditRequest = {
        status: 'Pending',
        changes: { name, flatNumber, gender, phone, personalEmail, dob }
      };
      // Note: We DO NOT set user.flatNumber here! It stays as the old value.
    } else {
      user.profileEditRequest = { status: 'None', changes: null };
    }

    // 5. Update History (Always record EVERY edit)
    user.profileEditHistory.push({
      changes: { name, flatNumber, gender, phone, personalEmail, dob },
      status: status,
      at: new Date()
    });

    const savedUser = await user.save();
    console.log(`[PROFILE] Update processed for: ${savedUser.email} (Status: ${status})`);
    
    return res.json({ 
      success: true, 
      message: hasFlatChange ? 'Profile saved. Flat change pending admin.' : 'Profile updated!',
      data: savedUser
    });

  } catch (err) {
    console.error('[PROFILE] FATAL UPDATE ERROR:', err);
    let errorMsg = 'Backend Error: ' + err.message;
    if (err.name === 'ValidationError') {
      errorMsg = 'Validation Error: ' + Object.values(err.errors).map(e => e.message).join(', ');
    }
    return res.status(500).json({ success: false, message: errorMsg });
  }
});

// ADMIN: Get all pending profile edit requests
router.get('/profile-requests', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
    const requests = await User.find({ societyName: req.user.societyName, 'profileEditRequest.status': 'Pending' })
      .select('name email flatNumber gender profileEditRequest');
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN: Approve or Reject profile edit request
router.post('/approve-profile/:userId', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
    const { action } = req.body; // 'Approve' or 'Reject'
    const user = await User.findById(req.params.userId);
    if (!user || user.profileEditRequest.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'No pending request found' });
    }

    if (action === 'Approve') {
      const { name, flatNumber, gender, phone, personalEmail, dob } = user.profileEditRequest.changes;
      user.name = name || user.name;
      user.flatNumber = flatNumber || user.flatNumber;
      user.gender = gender || user.gender;
      user.phone = phone || user.phone;
      user.personalEmail = personalEmail || user.personalEmail;
      
      // Handle Date of Birth specifically
      if (dob) {
        const parsedDate = new Date(dob);
        if (!isNaN(parsedDate.getTime())) {
          user.dob = parsedDate;
        }
      }
    }

    user.profileEditHistory.push({
      changes: user.profileEditRequest.changes,
      status: action === 'Approve' ? 'Approved' : 'Rejected',
      at: new Date()
    });
    
    user.profileEditRequest = { status: 'None', changes: null };
    await user.save();
    res.json({ success: true, message: `Request ${action}d successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN: Get all profile edit history
router.get('/profile-history', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin access required' });
    const history = await User.find({ societyName: req.user.societyName, 'profileEditHistory.0': { $exists: true } })
      .select('name email profileEditHistory')
      .sort({ 'profileEditHistory.at': -1 });
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN: Get full details of a specific resident
router.get('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    // Safety: Hide developers from Admins even if they have the ID
    if (user.isDeveloper) {
      return res.status(403).json({ success: false, message: 'Access denied: Developer profile' });
    }

    if (user.societyName !== req.user.societyName)
      return res.status(403).json({ success: false, message: 'Not authorized for this society' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const Society = require('../models/Society');
// GET ALL SOCIETIES (PUBLIC)
router.get('/societies', async (req, res) => {
  try {
    const list = await Society.find().sort({ city: 1, name: 1 });
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN: Get pending residents for their society
router.get('/pending-residents', protect, adminOnly, async (req, res) => {
  try {
    const residents = await User.find({ 
      societyName: req.user.societyName, 
      role: 'resident', 
      isApproved: false 
    }).select('name email flatNumber phone');
    res.json({ success: true, count: residents.length, data: residents });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN: Approve/Reject resident
router.post('/approve-resident/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.societyName !== req.user.societyName) {
      return res.status(404).json({ success: false, message: 'Resident not found in your society' });
    }
    user.isApproved = true;
    await user.save();
    res.json({ success: true, message: 'Resident approved!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/reject-resident/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.societyName !== req.user.societyName) {
      return res.status(404).json({ success: false, message: 'Resident not found in your society' });
    }
    // Delete account if rejected as per user request
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Resident rejected and account deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;