// Firebase Configuration
// Replace these values with your own Firebase project config
// Get these from: Firebase Console → Project Settings → Your apps → Config

import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCz1dODvw-0MPE0j93RuvrsiIMml7CCdQA",
  authDomain: "agent-ops-hackathon.firebaseapp.com",
  databaseURL: "https://agent-ops-hackathon-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "agent-ops-hackathon",
  storageBucket: "agent-ops-hackathon.firebasestorage.app",
  messagingSenderId: "28173964518",
  appId: "1:28173964518:web:9afc3fa88944f542811727",
  measurementId: "G-991H3K09V9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const database = getDatabase(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
