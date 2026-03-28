# SocietySphere — Professional Society Management Portal

SocietySphere is a high-performance, mobile-first society management solution designed to streamline communication between residents and management committees. Built with Node.js, MongoDB, and React Native (Expo).

---

## 🚀 Key Features

### 🚨 1. Emergency SOS Panic System
- **Global Alerts**: Instantly sound an alarm to every resident and security guard in the society.
- **24-Hour Auto-Expiry**: Emergency alerts are high-priority but automatically archive after 24 hours to keep the board clean.
- **Instant Response**: Optimized backend ensures alerts are posted even before push notifications finish sending.

### 👥 2. Secure Resident Directory & Profiles
- **Admin-Only Details**: Administrators can view full resident profiles (Phone, Email, DOB) with one tap.
- **Privacy Protection**: Screenshot and screen-recording blocking is enforced on sensitive detail pages.
- **Identity Verification**: Profile edits (Name, Flat #, Gender) require Administrative approval before being applied.

### 🗑️ 3. Advanced Notice Management & Trash Bin
- **Soft Deletion**: Notices are moved to a Trash Bin for 30 days before permanent erasure.
- **Document Vault**: Suppors external links (Google Drive/PDFs) for official documents.
- **LIFO Feed**: The latest updates always appear at the top.
- **Real-time Translation**: One-tap translation to Hindi and Marathi.

### 📞 4. Premium Utilities
- **Emergency Helpline**: Quick-dial directory for Society Security, Maintenance, and Management.
- **Quick Access Navigation**: Modern icon-based dashboard for one-tap navigation.

---

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js**: v18 or above.
- **MongoDB**: Local Community Server or Atlas Cloud.
- **Expo Go**: Installed on your Android/iOS physical device.

### 1. Backend Setup
1. `cd backend`
2. `npm install`
3. Create a `.env` file (copy from `.env.example`):
   ```env
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   ADMIN_KEY=SOCIETY@ADMIN2024
   ```
4. `npm start` (Server runs on port 5000)

### 2. Mobile App Setup
1. `cd mobile`
2. `npm install`
3. `npx expo install expo-screen-capture` (For privacy protection)
4. Update `mobile/constants/config.js` with your **Render URL** or **Local IP**.
5. `npx expo start`
6. Scan the QR code with your **Expo Go** app.

---

## 📱 Production Build (APK)
To generate a standalone APK:
1. `eas login`
2. `eas build:configure`
3. `eas build -p android --profile preview`

---

## 🎓 Project Team
- **College**: SMT. Indira Gandhi College of Engineering
- **Team**: Atharva | Abhinav | Shubham
- **Guide**: Prof. Jyoti Yadav

---

## 📜 License
This project is for educational purposes. All rights reserved by the development team. 2026.
