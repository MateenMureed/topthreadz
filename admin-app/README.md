# Top Threadz Admin — Native Android Mobile App

This directory contains the mobile-optimized React Native (Expo) Admin app for **Top Threadz**. It provides all the administrative powers of the web dashboard with a thumb-friendly, mobile-first UX.

## Features

- 📊 **Dashboard Hub**: Total Revenue, Daily Revenue, Active Orders, Pending Actions, Quick Shortcuts.
- 📦 **Order Management**: Status filters (`PENDING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`), order detail sheets with customer addresses, item lists, and 1-tap status transitions.
- 👔 **Products & Inventory**: Search by fabric/title, stock badges, and rapid "Add New Product" modal with image preview.
- 👥 **Customer Directory**: Shopper profile cards, email and phone numbers, role management.
- 💳 **Payment Approval Queue**: Manual review for Safepay & Bank Transfer verification with Approve / Reject decisions.
- ⚙️ **Store Settings**: Real-time update for delivery charges, free shipping threshold, customer support WhatsApp and phone lines.
- 🔐 **Dual Auth Support**: Works seamlessly via persistent Bearer tokens or Session cookies with the Top Threadz backend API.

---

## 🚀 How to Run & Build APK

### 1. Run in Development Mode (Android Phone / Emulator)
From the `admin-app` directory:
```bash
npm start
```
Scan the QR code with **Expo Go** on any Android device, or press `a` to open in an Android emulator.

### 2. Generate Installable Standalone APK (.apk)

#### Option A: Build via EAS (Recommended - 1 Command)
EAS Build creates an `.apk` file ready to install on any Android phone without needing Android Studio:
```bash
npx eas-cli build -p android --profile preview
```
*(Once complete, EAS provides a direct download link for the `.apk`)*

#### Option B: Local Android Project Generation
To build directly with Gradle on your local machine:
```bash
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```
The generated APK will be located at:
`android/app/build/outputs/apk/release/app-release.apk`
