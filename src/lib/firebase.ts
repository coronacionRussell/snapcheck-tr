
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
    return !!(config.apiKey && config.projectId && config.apiKey !== 'AIza...');
};

// Initialize Firebase
let app: FirebaseApp;

if (!isFirebaseConfigValid(firebaseConfig)) {
    // This block will run if the environment variables are not set correctly.
    console.error("Firebase configuration is invalid or missing.");
    console.error("Please ensure you have a .env file in the root of your project with the correct Firebase credentials.");
    console.error("After creating or updating the .env file, you MUST restart your development server.");

    // Throw a more descriptive error to stop the app from proceeding with a bad config.
    // Note: In a real production app, you might handle this differently, but for local dev, this is very clear.
    if (typeof window !== 'undefined') {
        // Show error on the client-side
         throw new Error(
            'Firebase configuration is missing. Please check your .env file and restart the server.'
         );
    } else {
        // Log error on server-side
        console.error('SERVER: Firebase configuration is missing.');
    }
}

if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}


const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage = getStorage(app);

export { app, db, auth, storage };
