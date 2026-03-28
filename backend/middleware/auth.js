const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User no longer exists' });
      }
      
      return next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Auth Failed: ' + err.message });
    }
  }
  if (!token) return res.status(401).json({ success: false, message: 'Authentication required: No token provided' });
};


const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admins only' });
};

module.exports = { protect, adminOnly };
