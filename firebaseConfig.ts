import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ---------------------------------------------------------------------------
// Configuration updated with credentials from provided project info.
// Project ID: uni-connect-b63b0
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyC6GPklXGg7BhPZCmOgIMYZsZIgCLbrWAM",
  authDomain: "uni-connect-b63b0.firebaseapp.com",
  projectId: "uni-connect-b63b0",
  storageBucket: "uni-connect-b63b0.firebasestorage.app",
  messagingSenderId: "757039046178",
  // Note: Using the provided Android App ID. For best web compatibility, 
  // register a Web App in the Firebase Console and update this ID.
  appId: "1:757039046178:android:d54158941e4add6bafb47b"
};

// Initialize Firebase with safety check
let app;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.error("Firebase initialization failed", error);
  // The app will degrade gracefully in Demo mode if these are undefined
}

export { db, auth };