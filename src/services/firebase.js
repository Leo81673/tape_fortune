import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCIOUI8KNxb5DAgrbfUSkEHe4Y8s6G2TGs",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "tape-fortune.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "tape-fortune",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "tape-fortune.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "945515712488",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:945515712488:web:c39707c74365c7aa199e5d",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-VFS5GSE97Y"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export default app;
