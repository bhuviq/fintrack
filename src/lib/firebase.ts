import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
export const auth = getAuth(app);

// Enable offline persistence
if (typeof window !== "undefined") {
    enableIndexedDbPersistence(db)
      .catch((err) => {
        if (err.code == 'failed-precondition') {
          // This can happen if you have multiple tabs open.
          console.warn("Firestore persistence failed: can only be enabled in one tab at a time.");
        } else if (err.code == 'unimplemented') {
          // The current browser does not support all of the
          // features required to enable persistence.
          console.warn("Firestore persistence is not supported in this browser.");
        }
      });
}


// NOTE: This function is deprecated and will be removed. 
// Services are being updated to use auth state directly.
export const getCurrentUserId = () => {
    const user = auth.currentUser;
    if (user) {
        return user.uid;
    }
    console.warn("getCurrentUserId was called without a logged-in user.");
    return 'test-user'; // Fallback for any unmigrated code
}


export { db };
