
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfigString = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;

if (!firebaseConfigString) {
    throw new Error('Missing Firebase config environment variable. Make sure NEXT_PUBLIC_FIREBASE_CONFIG is set in your .env file.');
}

let firebaseConfig;
try {
  firebaseConfig = JSON.parse(firebaseConfigString);
} catch (error) {
  console.error("Failed to parse Firebase config:", error);
  throw new Error("Firebase config is not valid JSON.");
}


// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log("Firebase connected successfully!");
} else {
    app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, db, auth };
