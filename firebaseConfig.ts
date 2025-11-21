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
const db = getFirestore(app);
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