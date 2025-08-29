
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "snapcheck-7jrhc",
  "appId": "1:782806426721:web:1e77ab7a152c7161007620",
  "storageBucket": "snapcheck-7jrhc.firebasestorage.app",
  "apiKey": "AIzaSyBrfQahV6yO9jGQfO3ORnbI065qcSk1N2w",
  "authDomain": "snapcheck-7jrhc.firebaseapp.com",
  "messagingSenderId": "782806426721",
  "measurementId": ""
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);


export { app, db, auth };
