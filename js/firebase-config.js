import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAd9doc6vUValG-0HL90HnOFa4JOuoV0Ik",
  authDomain: "labpin-dd039.firebaseapp.com",
  projectId: "labpin-dd039",
  storageBucket: "labpin-dd039.firebasestorage.app",
  messagingSenderId: "351109108936",
  appId: "1:351109108936:web:00cc2ff41ef13daca141fd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);