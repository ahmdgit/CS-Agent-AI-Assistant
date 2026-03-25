/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA14vYfq26H8u3c3Dfe6ZRvSjaPjCLK6w8",
  authDomain: "gen-lang-client-0868169208.firebaseapp.com",
  projectId: "gen-lang-client-0868169208",
  storageBucket: "gen-lang-client-0868169208.firebasestorage.app",
  messagingSenderId: "138781389809",
  appId: "1:138781389809:web:efb3375c5ea38e9fcc4a50",
  measurementId: "G-C90E4MD6V0"
};

const hasFirebaseConfig = !!firebaseConfig.apiKey;

export const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
export const db = hasFirebaseConfig ? getFirestore(app) : null;
export const auth = hasFirebaseConfig ? getAuth(app!) : null;
export const googleProvider = new GoogleAuthProvider();
