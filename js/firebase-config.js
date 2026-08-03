// Firebase initialization
// Replace the values below with YOUR project's config,
// found in Firebase Console → Project Settings → General → Your apps → SDK setup and configuration

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBhq9uoXu09Q-vpdsL-59B2IpsHHIfNkPM",
  authDomain: "pathasetu.firebaseapp.com",
  projectId: "pathasetu",
  storageBucket: "pathasetu.firebasestorage.app",
  messagingSenderId: "230755066422",
  appId: "1:230755066422:web:f63cf35c2b2d4dac9a6e97"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
