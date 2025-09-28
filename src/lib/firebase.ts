
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

// This function initializes Firebase and is designed to be called in the browser.
// It's safe to call it multiple times, as it checks if Firebase is already initialized.
function initializeFirebaseClient() {
    if (typeof window !== 'undefined') {
        if (!getApps().length) {
            // Check for valid config before initializing
            if (firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('YOUR_')) {
                return initializeApp(firebaseConfig);
            } else {
                console.error('Firebase configuration is invalid or missing. Please check your environment variables.');
                return null;
            }
        }
        return getApp();
    }
    return null;
}

const initializedApp = initializeFirebaseClient();

if (initializedApp) {
    app = initializedApp;
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
} else {
    // If the app is running on the server or initialization fails,
    // these will be undefined. Application logic should handle this gracefully,
    // for example by only calling Firebase services inside useEffect or client components.
}

export { app, db, auth, storage };
