/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

console.log("Firebase Config:", firebaseConfig);

const hasFirebaseConfig = !!firebaseConfig.apiKey;

export const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
export const db = hasFirebaseConfig ? getFirestore(app, firebaseConfig.firestoreDatabaseId) : null;
export const auth = hasFirebaseConfig ? getAuth(app!) : null;
export const googleProvider = new GoogleAuthProvider();
