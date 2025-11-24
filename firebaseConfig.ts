import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

// ---------------------------------------------------------------------------
// Firebase Configuration for UniConnect
// Project ID: campus-connect-fd225
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCEnrTZlR-6DrxnRT8secbbidjfw5vzIyc",
  authDomain: "campus-connect-fd225.firebaseapp.com",
  projectId: "campus-connect-fd225",
  storageBucket: "campus-connect-fd225.firebasestorage.app",
  messagingSenderId: "258370587794",
  appId: "1:258370587794:web:86b682bbcb6ef5d068aa4b",
  measurementId: "G-PPW76QX696"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with error handling
let db;
try {
  db = getFirestore(app);
  console.log('✅ Firestore initialized');
} catch (error: any) {
  console.error('❌ Firestore initialization error:', error);
  
  // Check for CORS/access control errors
  if (error?.message?.includes('access control') || error?.message?.includes('CORS') || error?.message?.includes('Fetch API cannot load')) {
    console.error('🔧 FIRESTORE CORS ERROR DETECTED!');
    console.error('Please follow these steps:');
    console.error('1. Enable Firestore API: https://console.cloud.google.com/apis/library/firestore.googleapis.com?project=campus-connect-fd225');
    console.error('2. Publish Firestore Rules: https://console.firebase.google.com/project/campus-connect-fd225/firestore/rules');
    console.error('3. Check database exists: https://console.firebase.google.com/project/campus-connect-fd225/firestore');
  }
  
  // Try to initialize with explicit settings
  try {
    db = getFirestore(app);
    console.log('✅ Firestore initialized (retry successful)');
  } catch (e: any) {
    console.error('❌ Firestore failed to initialize:', e);
    console.error('Please enable Firestore in Firebase Console and refresh the page.');
    // Don't throw - allow app to continue (it will show errors in components)
  }
}

const auth = getAuth(app);

// Storage might not be available on free tier without billing enabled
// The app will work fine without it - image uploads will just be disabled
let storage;
try {
  storage = getStorage(app);
  console.log('✅ Firebase Storage initialized');
} catch (error) {
  console.warn('⚠️ Firebase Storage not available - image uploads disabled');
  console.warn('To enable: Upgrade to Blaze plan or wait for Google to fix free tier access');
}

const googleProvider = new GoogleAuthProvider();

export { db, auth, storage, googleProvider };