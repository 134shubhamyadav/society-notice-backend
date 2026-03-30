const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load env from the monorepo backend folder
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedOwner = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/societynotice';
    console.log(`Connecting to: ${MONGO_URI}`);
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // CLEAR OLD ADMIN if it exists to fix schema/status issues
    const adminEmail = 'owner@society.com';
    await User.deleteMany({ email: adminEmail });
    console.log('🗑️  Old admin cleared for fresh start');

    // Create fresh admin
    const admin = await User.create({
      name: 'Super Admin',
      email: adminEmail,
      password: 'adminpassword123',
      role: 'admin',
      societyName: 'SocietySphere Elite',
      flatNumber: '001',
      phone: '9999999999',
      personalEmail: 'admin@elite.com',
      gender: 'Male',
      dob: new Date('1990-01-01'),
      securityKey: 'SOCIETY@2024'
    });

    console.log('🎉 SUCCESS: Admin account created/reset to stable state.');
    console.log('📧 Login Email: ' + admin.email);
    console.log('🔑 Password: adminpassword123');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ SEED ERROR:', err.message);
    process.exit(1);
  }
};

seedOwner();
