import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDFNpTiCdKAW8Bt6CiKkSn5SFsaoJgu448",
  authDomain: "smart-krishi-b5ba0.firebaseapp.com",
  databaseURL: "https://smart-krishi-b5ba0-default-rtdb.firebaseio.com",
  projectId: "smart-krishi-b5ba0",
  storageBucket: "smart-krishi-b5ba0.firebasestorage.app",
  messagingSenderId: "178680720760",
  appId: "1:178680720760:web:ed4ec9a80dec4a08992c8d",
  measurementId: "G-K5LP5G2D45"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app); // For Firestore
export const realtimeDb = getDatabase(app); // For Realtime Database (due to databaseURL)

export default app;
