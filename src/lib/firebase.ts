
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

const isFirebaseConfigValid = (config: any): boolean => {
    return !!(config.apiKey && config.projectId && !config.apiKey.includes('YOUR_'));
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage;


if (!isFirebaseConfigValid(firebaseConfig)) {
    const errorMessage = `Firebase configuration is invalid or missing. Please ensure your .env file is in the project root and the server has been restarted. The API Key being read is: '${firebaseConfig.apiKey}'. If this is 'undefined', the .env file is not being loaded.`;
    
    // In a local development environment, it's better to fail loudly.
    if (process.env.NODE_ENV === 'development') {
        throw new Error(errorMessage);
    } else {
    // In production, we log the error but don't crash the app.
        console.error(errorMessage);
    }
}

try {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }

    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

} catch (error: any) {
    let errorMessage = `An unexpected Firebase error occurred: ${error.message}`;

    if (error.code === 'auth/invalid-api-key') {
        errorMessage = `Firebase Error: Invalid API Key. Please double-check that the NEXT_PUBLIC_FIREBASE_API_KEY in your .env file is correct and that you have restarted the development server.`;
    }
    
    if (process.env.NODE_ENV === 'development') {
        throw new Error(errorMessage);
    } else {
        console.error(errorMessage);
    }
}


export { app, db, auth, storage };
