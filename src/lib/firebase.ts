
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
    return !!(config.apiKey && config.projectId && !config.apiKey.startsWith('YOUR_'));
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage;

if (!isFirebaseConfigValid(firebaseConfig)) {
    console.error("Firebase configuration is invalid or missing.");
    console.error("Please ensure you have a .env file in the root of your project with your actual Firebase credentials.");
    console.error("After creating or updating the .env file, you MUST restart your development server.");
    
    // In a development environment, throw a clear error to stop execution.
    // This helps developers realize the setup is incomplete immediately.
    if (process.env.NODE_ENV === 'development') {
         throw new Error(
            'Firebase configuration is invalid or missing. Please check your .env file and restart the server. The current API Key is: ' + process.env.NEXT_PUBLIC_FIREBASE_API_KEY
         );
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
