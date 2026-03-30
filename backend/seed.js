const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('./models/User');
const Society = require('./models/Society');

dotenv.config({ path: path.join(__dirname, '.env') });

const developers = [
  {
    name: 'Developer One',
    email: 'dev1@societysphere.com',
    password: 'DevPass@2024_01',
    role: 'developer',
    societyName: 'Developer HQ',
    isApproved: true,
    phone: '0000000001',
    personalEmail: 'dev1@internal.com',
    dob: new Date(1990, 0, 1)
  },
  {
    name: 'Developer Two',
    email: 'dev2@societysphere.com',
    password: 'DevPass@2024_02',
    role: 'developer',
    societyName: 'Developer HQ',
    isApproved: true,
    phone: '0000000002',
    personalEmail: 'dev2@internal.com',
    dob: new Date(1991, 0, 1)
  },
  {
    name: 'Developer Three',
    email: 'dev3@societysphere.com',
    password: 'DevPass@2024_03',
    role: 'developer',
    societyName: 'Developer HQ',
    isApproved: true,
    phone: '0000000003',
    personalEmail: 'dev3@internal.com',
    dob: new Date(1992, 0, 1)
  }
];

const initialSocieties = [
  { name: 'Sunrise Apartments', city: 'Mumbai' },
  { name: 'Green Valley', city: 'Pune' },
  { name: 'Lotus Residency', city: 'Bangalore' },
  { name: 'Developer HQ', city: 'Cloud' }
];

const seed = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    // Seed Societies
    for (const s of initialSocieties) {
      await Society.findOneAndUpdate({ name: s.name }, s, { upsert: true });
    }
    console.log('✅ Societies seeded');

    // Seed Developers
    for (const d of developers) {
      const existing = await User.findOne({ email: d.email });
      if (!existing) {
        await User.create(d);
        console.log(`Created dev: ${d.email}`);
      } else {
        console.log(`Dev already exists: ${d.email}`);
      }
    }

    console.log('✅ Developer accounts seeded');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
  }
};

module.exports = seed;

// Keep the immediate execution if run directly via 'node seed.js'
if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI).then(() => seed().then(() => process.exit(0)));
}
