
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

// A function to check if the config is valid
const isFirebaseConfigValid = (config: any): boolean => {
    return !!(config.apiKey && config.projectId && !config.apiKey.includes('YOUR_'));
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage;

if (!isFirebaseConfigValid(firebaseConfig)) {
    const errorMessage = "Firebase configuration is invalid or missing. Please ensure you have a .env file in the root of your project with your actual Firebase credentials. After creating or updating the .env file, you MUST restart your development server.";
    
    // In a development environment, throw a more detailed error to stop execution.
    if (process.env.NODE_ENV === 'development') {
         throw new Error(
            `${errorMessage} The current API Key is: '${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}'. If this is 'undefined' or a placeholder, your .env file is not being read correctly.`
         );
    } else {
        // In production, just log the error to avoid crashing the entire app.
        console.error(errorMessage);
    }
}


if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

auth = getAuth(app);
db = getFirestore(app);
storage = getStorage(app);

export { app, db, auth, storage };

