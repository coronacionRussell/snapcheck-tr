
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app: FirebaseApp;
if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
        console.log("Firebase connected successfully!");
    } else {
        app = getApp();
    }
} else {
    console.warn("Firebase config missing. Using placeholder app to prevent build errors.");
    if (!getApps().length) {
        // Use a placeholder config if the real one is not available
        app = initializeApp({ apiKey: "placeholder", authDomain: "placeholder.firebaseapp.com", projectId: "placeholder" });
    } else {
        app = getApp();
    }
}


const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage = getStorage(app);

export { app, db, auth, storage };
