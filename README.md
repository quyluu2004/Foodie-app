
  🍳 Foodie - Recipe & Food Social Mobile App</h1>
  A comprehensive platform for finding, sharing, and discussing food recipes, complete with real-time community engagement features and a robust administrative dashboard.</p>
<div align="center">
  <h1 align="center">Foodie - Social Culinary Platform</h1>

  <p align="center">
    A community-driven application for users to explore diverse recipes and engage via real-time posts.
    <br />
    <br />
    <a href="#"></a>
    ·
    <a href="#"></a>
    ·
    <a href="#"></a>
  </p>
</div>

<div align="center">
  
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)

</div>
🍳 Foodie - Recipe & Food Social Mobile App</h1>
  A comprehensive platform for finding, sharing, and discussing food recipes, complete with real-time community engagement features and a robust administrative dashboard.

## 📖 Overview

**Foodie** is a full-stack social networking and recipe-sharing application tailored for food enthusiasts. It provides an engaging mobile experience for users to discover new recipes, interact with a community of food lovers, and share their culinary creations. The platform is supported by a robust Node.js backend and a comprehensive React administrative dashboard for content moderation and management.

## ✨ Key Features

- **📱 User Application (Mobile)**
  - **Social Authentication:** Secure login via Email/Password and Google Sign-in.
  - **Recipe Discovery:** Browse, search, and discover a wide variety of recipes.
  - **Community Hub:** Share posts, interact with others, and participate in food-related discussions.
  - **Real-Time Features:** Live notifications and chat interactions powered by Socket.io.
  
- **🔐 Administrative Dashboard (Web/Admin)**
  - **Content Moderation:** Manage users, recipes, and community posts efficiently.
  - **Analytics:** Visualize data via interactive charts (Recharts).
  - **Real-Time Updates:** Monitor live platform activities.

- **⚙️ Backend API**
  - **RESTful Architecture:** Express.js based robust API.
  - **Media Management:** Seamless image uploads and hosting via Cloudinary.
  - **AI Integration:** Powered by Google Generative AI for smart recipe suggestions/processing.
  - **Security:** Rate limiting, JWT authentication, bcrypt password hashing, and Helmet.

## 🛠️ Tech Stack

### Mobile App (Frontend)
- **Framework:** React Native, Expo
- **Routing:** Expo Router, React Navigation
- **State & Form Handling:** Formik, Yup, AsyncStorage
- **Networking & Real-time:** Axios, Socket.io-client
- **UI & Animation:** Expo Vector Icons, React Native Reanimated

### Admin Dashboard (Frontend)
- **Framework:** React 19, Vite
- **Styling:** Tailwind CSS (v4)
- **Routing:** React Router DOM
- **Data Visualization:** Recharts
- **Icons & Animations:** Lucide React, Animate.css

### Backend API
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (with Mongoose)
- **Real-time Engine:** Socket.io
- **Cloud Storage:** Cloudinary (with Multer for uploads)
- **Authentication & Security:** JSON Web Tokens (JWT), bcryptjs, Helmet
- **AI Integration:** `@google/generative-ai`

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB instance (local or Atlas)
- Expo Go app on your phone (or an emulator for React Native)
- Required API Keys (Cloudinary, Google OAuth, Gemini API, etc.)

### 1. Backend Setup
```bash
cd foodie-backend
npm install
# Ensure you construct a .env file with appropriate credentials:
# PORT, MONGODB_URI, JWT_SECRET, CLOUDINARY_URL, GEMINI_API_KEY, etc.
npm run dev
```

### 2. Admin Dashboard Setup
```bash
cd foodie-admin
npm install
npm run dev
```

### 3. Mobile App Setup
```bash
cd mobile
npm install
npm run start
# Scan the QR code from your terminal using Expo Go (on physical device) or press "a" for Android emulator / "i" for iOS simulator.
```
