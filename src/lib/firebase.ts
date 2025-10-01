
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
            if (
                firebaseConfig.apiKey &&
                !firebaseConfig.apiKey.startsWith('AIza') && // A basic check for a valid key format
                !firebaseConfig.apiKey.includes('your-') 
            ) {
                 console.error(
                    'Firebase configuration error: NEXT_PUBLIC_FIREBASE_API_KEY seems invalid. Please check your .env file and ensure it is a valid key from your Firebase project settings.'
                );
                return null;
            }

            if (!firebaseConfig.projectId) {
                 console.error(
                    'Firebase configuration error: NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing. Please check your .env file.'
                );
                return null;
            }
            
            return initializeApp(firebaseConfig);
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
    if (typeof window !== 'undefined') {
        console.error("Firebase could not be initialized. Please check your .env file and Firebase project configuration.");
    }
}

export { app, db, auth, storage };
