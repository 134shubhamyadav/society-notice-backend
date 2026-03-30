const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');
const Society = require('./models/Society');

// Safety check for critical environment variables
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ WARNING: JWT_SECRET is not defined in your .env file! Using a temporary fallback for development.');
  process.env.JWT_SECRET = 'SOCIETY_TEMP_KEY_2024';
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/auth');
const noticeRoutes = require('./routes/notices');
const helplineRoutes = require('./routes/helplines');
const complaintRoutes = require('./routes/complaints');
const visitorRoutes = require('./routes/visitors');
const developerRoutes = require('./routes/developer');

app.use('/api/auth', authRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/helplines', helplineRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/developer', developerRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'SocietySphere Production API is live ✅', 
    timestamp: new Date().toISOString() 
  });
});

// GLOBAL ERROR HANDLER - Repair everything catch-all
app.use((err, req, res, next) => {
  console.error('[GLOBAL ERROR]:', err.message, err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: 'System Error: ' + err.message,
    error: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

const seed = require('./seed');

// Connect MongoDB then start server
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ MongoDB connected');
    
    // Auto-seed if database is uninitialized (No developers found)
    const devCount = await User.countDocuments({ role: 'developer' });
    if (devCount === 0) {
      console.log('⚡ Initializing database (auto-seeding)...');
      await seed();
    } else {
      // Migration: Ensure all societies have a 'state' (Required for the new registration filter)
      const needsMigration = await Society.findOne({ state: { $exists: false } });
      if (needsMigration) {
        console.log('⚡ Migrating legacy societies (adding default state)...');
        await Society.updateMany({ state: { $exists: false } }, { state: 'Maharashtra' });
        console.log('✅ Migration complete');
      }
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`   Local:   http://localhost:${PORT}`);
      console.log(`   Network: http://<YOUR_IP>:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });