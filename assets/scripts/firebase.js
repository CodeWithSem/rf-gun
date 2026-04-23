import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Main Firebase config
export const firebaseConfig = {
  apiKey: "AIzaSyAF96p13wi5B3ofmom9c_p21ht4l7SNgl0",
  authDomain: "qs-system-demo.firebaseapp.com",
  databaseURL:
    "https://qs-system-demo-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "qs-system-demo",
  storageBucket: "qs-system-demo.firebasestorage.app",
  messagingSenderId: "641710365797",
  appId: "1:641710365797:web:ccfe8ca657f09de0c13a8c",
};

// ✅ Main app
const app = initializeApp(firebaseConfig);

// Export main databases and auth
export const realtime_db = getDatabase(app);
export const firestore_db = getFirestore(app);
export const auth = getAuth(app);

// ✅ Secondary app for admin-created users (prevents auto-login)
const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
export const secondary_auth = getAuth(secondaryApp);
