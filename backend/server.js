require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

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

app.use('/api/auth', authRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/helplines', helplineRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/visitors', visitorRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Society Notice API is running ✅', time: new Date().toISOString() });
});

// Connect MongoDB then start server
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
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