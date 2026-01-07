# 🚀 Agent Ops Hackathon 2025 - Progress Tracker

A gamified, real-time progress tracker for your team's AI/Agent Ops hackathon with Firebase sync and authentication.

## ✨ Features

- ✅ **User Authentication** - Email/password login
- ✅ **Profile Claiming** - Users claim and own their profile
- ✅ **Self-edit Only** - Users can only update their own data
- ✅ **Real-time sync** - All team members see updates instantly
- ✅ **XP & leveling system** - Gamified progress tracking
- ✅ **Achievement badges** - Unlock badges for milestones
- ✅ **Live leaderboard** - Competitive rankings
- ✅ **Offline fallback** - Works even without internet
- ✅ **Cyberpunk UI** - Stunning visual design

---

## 🔥 Firebase Setup (FREE - 15 minutes)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Name it `agent-ops-hackathon`
4. Disable Google Analytics (optional)
5. Click **"Create project"**

### Step 2: Enable Authentication

1. Click **"Build"** → **"Authentication"**
2. Click **"Get started"**
3. Click **"Email/Password"** provider
4. **Enable** "Email/Password" (first toggle)
5. Click **"Save"**

### Step 3: Enable Realtime Database

1. Click **"Build"** → **"Realtime Database"**
2. Click **"Create Database"**
3. Choose a location closest to your team
4. Select **"Start in test mode"**
5. Click **"Enable"**

### Step 4: Get Your Config

1. Click ⚙️ **Project Settings** → **Your apps** → **Web icon** `</>`
2. Register app with nickname (e.g., "hackathon-tracker")
3. **Copy the config object**

### Step 5: Add Config to Your App

Open `src/firebase.js` and paste your config:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // ← Your values here
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Step 6: (Optional) Secure Database Rules

In Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "hackathon": {
      "team": {
        ".read": true,
        ".write": "auth != null"
      }
    }
  }
}
```

This allows anyone to read, but only logged-in users can write.

---

## 🔐 How Authentication Works

1. **Sign Up / Login** - Users create an account with any email + password
2. **Claim Profile** - After logging in, users click "Claim Profile" on their name
3. **Edit Own Data** - Once claimed, only that user can edit their profile
4. **View Everyone** - All users can view everyone's progress

### User Flow:
```
Login → See all profiles → Find your name → Click "Claim Profile" → Now only you can edit it
```

### Profile States:
- **Unclaimed** - Shows yellow "Claim Profile" button (anyone can claim)
- **Claimed by you** - Shows green "Update Status" button + "YOUR PROFILE" badge
- **Claimed by others** - Shows gray "Claimed" button (can't edit)

---

## 🚀 Deploy in 5 Minutes

### Option 1: Vercel (Recommended)

```bash
# 1. Install dependencies
npm install

# 2. Test locally
npm run dev

# 3. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/agent-ops-hackathon.git
git push -u origin main

# 4. Deploy on Vercel
# Go to vercel.com → New Project → Import your repo → Deploy
```

Your app will be live at `https://your-project.vercel.app` 🎉

### Option 2: Netlify

1. Push to GitHub (same as above)
2. Go to [netlify.com](https://netlify.com)
3. "Add new site" → "Import from Git"
4. Select your repo
5. Build settings auto-detect (Vite)
6. Click "Deploy"

### Option 3: Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and init
firebase login
firebase init hosting

# Select your project, set 'dist' as public directory
# Build and deploy
npm run build
firebase deploy
```

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📝 Customize Your Team

Edit `src/App.jsx` and modify the `defaultTeamMembers` array:

```javascript
const defaultTeamMembers = [
  { 
    id: 1, 
    name: 'Your Name', 
    role: 'Your Role', 
    avatar: '🎨',  // Any emoji
    completedMilestones: [],
    workflows: [],
    streak: 0
  },
  // Add more team members...
];
```

### Available Avatars (Emoji Ideas)
```
🎨 Designer    📈 Growth     🚀 PM
🔍 QA          ✨ UX         🛡️ Security
💻 Developer   📊 Analytics  🎯 Strategy
```

### Customize Milestones

```javascript
const milestones = [
  { id: 1, date: 'JAN 7', title: 'PREP', desc: 'Description', xp: 100, icon: '📚' },
  // Modify dates, titles, XP values...
];
```

---

## 🎮 How It Works

| Action | XP Reward |
|--------|-----------|
| Complete Preparation | +100 XP |
| Attend Workshop | +150 XP |
| Submit Demo Pack | +300 XP |
| Mid-Period Checkpoint | +200 XP |
| Final Evaluation | +500 XP |

**Leveling:** Every 200 XP = 1 Level

**Badges:**
- 🌅 Early Bird - Complete prep on time
- 🧙 Workflow Wizard - 3+ workflows submitted
- 🔥 Streak Master - 5+ day streak
- 🐛 Bug Hunter - QA role
- 💡 Creative Genius - Design/Marketing role

---

## 🔧 Troubleshooting

### "Permission denied" error
→ Check Firebase Realtime Database rules are set to allow read/write

### Data not syncing
→ Verify `databaseURL` in firebase.js matches your Firebase project

### Build fails
→ Run `npm install` and check for typos in firebase.js

### Offline mode showing
→ Check internet connection; app falls back to localStorage when Firebase unavailable

---

## 📦 Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Firebase Realtime Database** - Real-time sync
- **CSS-in-JS** - Styled components

---

## 🆓 Firebase Free Tier Limits

More than enough for a team hackathon:
- 1GB storage
- 10GB/month downloads
- 100 simultaneous connections
- Unlimited reads/writes (within reason)

---

## 🤝 Need Help?

1. Check Firebase docs: https://firebase.google.com/docs
2. Vite docs: https://vitejs.dev
3. React docs: https://react.dev

Good luck with your hackathon! 🚀
