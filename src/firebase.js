import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Expect Firebase config via Vite env vars
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Basic validation to help during deployment
for (const [key, value] of Object.entries(firebaseConfig)) {
  if (!value) {
    // eslint-disable-next-line no-console
    console.warn(`Missing Firebase config for ${key}. Set it in your .env as VITE_${key}`);
  }
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
