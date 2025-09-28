
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

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: any;

function initializeFirebase() {
    if (typeof window === 'undefined') {
        return null;
    }

    // Check for valid config
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('YOUR_')) {
        console.error('Firebase configuration is invalid. Please check your .env.local file.');
        return null;
    }

    try {
        if (!getApps().length) {
            return initializeApp(firebaseConfig);
        } else {
            return getApp();
        }
    } catch(e) {
        console.error('Failed to initialize Firebase.', e);
        return null;
    }
}

const initializedApp = initializeFirebase();

if (initializedApp) {
    app = initializedApp;
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
} else {
    // In a server-side context or if initialization fails,
    // these will be undefined. Your application logic
    // (e.g., in `useAuth`) should handle this gracefully.
}

export { app, db, auth, storage };
