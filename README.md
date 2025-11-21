# 🎓 UniConnect - Complete University Social Platform

A production-ready, full-featured university social platform built with React, TypeScript, Firebase, and modern web technologies.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Firebase Setup](#firebase-setup)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Security Rules](#security-rules)
- [Testing](#testing)
- [Deployment](#deployment)

---

## ✨ Features

### 🔐 Authentication
- Email/Password signup and login
- Google Sign-In
- Password reset functionality
- Secure session management
- Profile onboarding flow

### 👤 User Profiles
- View and edit your profile
- Upload profile avatars
- Add bio, location, contact info
- Link social media accounts
- Share public profile via Web Share API
- View other users' public profiles

### 📱 Social Feed
- Create text posts with multiple images
- Like and unlike posts
- Comment on posts with real-time updates
- Infinite scroll pagination
- Delete/edit your own posts
- See post author profiles

### 📅 Events
- Create and manage campus events
- RSVP to events (Going/Interested/Not Going)
- Event details with cover images
- Capacity management
- View attendee lists
- Filter by category (Academic, Social, Sports, Career, Arts)
- Edit/delete events (host only)

### 👥 Groups
- Create public or private groups
- Join public groups instantly
- Request to join private groups
- Group-specific posts and discussions
- Member management (add/remove/promote)
- Role-based permissions (owner, admin, member)
- Leave groups

### 🛒 Marketplace
- List items for sale with multiple images
- Browse and search listings
- Filter by category, price, condition
- Send inquiries to sellers
- Mark items as sold
- Manage your listings

### 🔔 Notifications
- In-app notifications for:
  - New comments on your posts
  - Likes on your posts
  - Group invitations
  - Event updates
  - Marketplace inquiries
- Unread notification count
- Mark as read/clear all

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript
- **Routing**: React Router DOM v6
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **Backend**: Firebase
  - Authentication (Email/Password + Google)
  - Firestore Database
  - Cloud Storage
- **Build Tool**: Vite
- **Code Quality**: TypeScript strict mode

---

## 📦 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Firebase Account** (free tier is sufficient)
- **Google Cloud Project** (created automatically with Firebase)

---

## 🔥 Firebase Setup

### Step 1: Enable Authentication

**⚠️ IMPORTANT: This step is REQUIRED to fix the authentication error!**

1. Go to [Firebase Console](https://console.firebase.google.com/project/uni-connect-b63b0/authentication/providers)
2. Click on **"Get Started"** if you haven't enabled Authentication yet
3. Navigate to **"Sign-in method"** tab
4. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle **"Enable"** to ON
   - Click **"Save"**
5. Enable **Google** (optional but recommended):
   - Click on "Google"
   - Toggle **"Enable"** to ON
   - Select your support email
   - Click **"Save"**

### Step 2: Enable Firestore Database

1. Go to [Firestore Database](https://console.firebase.google.com/project/uni-connect-b63b0/firestore)
2. Click **"Create Database"**
3. Choose **"Start in test mode"** for development
4. Select your preferred location (e.g., us-central1)
5. Click **"Enable"**

### Step 3: Deploy Security Rules

After Firestore is enabled:

1. In Firestore Console, go to **"Rules"** tab
2. Copy the contents from `firestore.rules` in this project
3. Paste into the Firebase Console editor
4. Click **"Publish"**

### Step 4: Enable Cloud Storage

1. Go to [Storage](https://console.firebase.google.com/project/uni-connect-b63b0/storage)
2. Click **"Get Started"**
3. Choose **"Start in test mode"** for development
4. Select the same location as Firestore
5. Click **"Done"**

### Step 5: Deploy Storage Rules

After Storage is enabled:

1. In Storage Console, go to **"Rules"** tab
2. Copy the contents from `storage.rules` in this project
3. Paste into the Firebase Console editor
4. Click **"Publish"**

### Step 6: Initialize Sample Data

After Firestore is enabled, run:

```bash
npm run init-db
```

This will populate your database with sample:
- Posts
- Events
- Marketplace listings

---

## 💻 Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd UNI-CONNECT
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration (Optional)

For Gemini AI features, create a `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your free API key at: https://aistudio.google.com/apikey

**Note**: The app works perfectly without this. AI features will show demo messages.

---

## 🚀 Running the Application

### Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

---

## 📁 Project Structure

```
UNI-CONNECT/
├── components/
│   ├── Header.tsx              # Mobile header component
│   └── Navigation.tsx          # Navigation bar (desktop sidebar + mobile bottom bar)
├── pages/
│   ├── Feed.tsx               # Social feed with posts
│   ├── Events.tsx             # Events management
│   ├── Marketplace.tsx        # Marketplace listings
│   ├── StudyGroups.tsx        # Study groups and discussions
│   ├── Profile.tsx            # User profiles
│   ├── Login.tsx              # Authentication page
│   └── Onboarding.tsx         # New user onboarding
├── services/
│   ├── authService.ts         # Authentication functions
│   ├── postService.ts         # Post CRUD operations
│   ├── eventService.ts        # Event management
│   ├── groupService.ts        # Group operations
│   ├── marketplaceService.ts  # Marketplace functions
│   ├── notificationService.ts # Notifications
│   ├── profileService.ts      # Profile management
│   ├── storageService.ts      # File uploads
│   └── geminiService.ts       # AI integration
├── firebaseConfig.ts          # Firebase initialization
├── types.ts                   # TypeScript type definitions
├── App.tsx                    # Main app component with routing
├── index.tsx                  # Application entry point
├── firestore.rules            # Firestore security rules
├── storage.rules              # Storage security rules
└── initFirebase.ts           # Database initialization script
```

---

## 🔒 Security Rules

### Firestore Rules

The application implements comprehensive security rules:

- **Users Collection**:
  - Public read access for profiles
  - Users can only edit their own profile
  - Private notifications subcollection

- **Posts Collection**:
  - Public read access
  - Authenticated users can create posts
  - Only authors can edit/delete their posts
  - Likes and comments with proper permissions

- **Events Collection**:
  - Public read for public events
  - Only hosts can edit/delete events
  - RSVP management

- **Groups Collection**:
  - Private groups restricted to members
  - Role-based permissions (owner/admin/member)
  - Member management controls

- **Marketplace Collection**:
  - Public read access
  - Sellers can manage their listings
  - Inquiry system with privacy controls

### Storage Rules

- **Avatar Uploads**: Users can only upload/delete their own avatars
- **Post Images**: Authenticated users can upload, only authors can delete
- **Event/Group Covers**: Creator/admin permissions
- **File Size Limit**: 10MB per file
- **Type Restriction**: Images only

---

## 🧪 Testing

### Manual Testing Checklist

#### Authentication
- [ ] Sign up with email/password
- [ ] Sign in with email/password
- [ ] Sign in with Google
- [ ] Password reset
- [ ] Sign out

#### Profile
- [ ] View own profile
- [ ] Edit profile information
- [ ] Upload avatar
- [ ] Add social links
- [ ] Share profile link
- [ ] View other user profiles

#### Feed
- [ ] Create text post
- [ ] Create post with images
- [ ] Like/unlike posts
- [ ] Add comments
- [ ] Delete own posts
- [ ] Scroll pagination

#### Events
- [ ] Create event
- [ ] RSVP to event
- [ ] View event details
- [ ] Edit own event
- [ ] Delete own event
- [ ] View attendees

#### Groups
- [ ] Create public group
- [ ] Create private group
- [ ] Join public group
- [ ] Request to join private group
- [ ] Create group post
- [ ] Leave group
- [ ] Manage members (admin)

#### Marketplace
- [ ] Create listing
- [ ] Upload product images
- [ ] Search listings
- [ ] Filter by category/price
- [ ] Send inquiry
- [ ] Mark as sold
- [ ] Delete listing

#### Notifications
- [ ] Receive notifications
- [ ] Mark as read
- [ ] Clear notifications
- [ ] Notification count badge

---

## 🌐 Deployment

### Deploy to Firebase Hosting

1. Install Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Login to Firebase:

```bash
firebase login
```

3. Initialize Firebase Hosting:

```bash
firebase init hosting
```

Select:
- Use existing project: `uni-connect-b63b0`
- Public directory: `dist`
- Configure as SPA: Yes
- Overwrite index.html: No

4. Build and deploy:

```bash
npm run build
firebase deploy
```

### Deploy to Vercel

1. Install Vercel CLI:

```bash
npm install -g vercel
```

2. Deploy:

```bash
npm run build
vercel --prod
```

### Deploy to Netlify

1. Install Netlify CLI:

```bash
npm install -g netlify-cli
```

2. Deploy:

```bash
npm run build
netlify deploy --prod --dir=dist
```

---

## 🐛 Troubleshooting

### Authentication Error: "operation-not-allowed"

**Solution**: Enable Email/Password authentication in Firebase Console (See Firebase Setup Step 1)

### Firestore Permission Denied

**Solution**: 
1. Enable Firestore Database (See Firebase Setup Step 2)
2. Deploy security rules (See Firebase Setup Step 3)

### Storage Upload Fails

**Solution**: 
1. Enable Cloud Storage (See Firebase Setup Step 4)
2. Deploy storage rules (See Firebase Setup Step 5)

### Build Errors

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
# Optional: Gemini AI API Key
GEMINI_API_KEY=your_api_key_here
```

**Note**: Firebase credentials are already configured in `firebaseConfig.ts`. Do not commit sensitive credentials to version control.

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Built with React and Firebase
- UI inspired by modern social platforms
- Icons by Lucide React
- Styling with TailwindCSS

---

## 📧 Support

For issues and questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review [Firebase Setup](#firebase-setup) steps
- Check Firebase Console for service status

---

**Happy Coding! 🎉**
