
import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "snapcheck-7jrhc",
  "appId": "1:782806426721:web:1e77ab7a152c7161007620",
  "storageBucket": "snapcheck-7jrhc.firebasestorage.app",
  "apiKey": "AIzaSyBrfQahV6yO9jGQfO3ORnbI065qcSk1N2w",
  "authDomain": "snapcheck-7jrhc.firebaseapp.com",
  "messagingSenderId": "782806426721"
};

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
