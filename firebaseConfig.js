// ✅ Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

// 🔹 Your Firebase configuration (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyDbKUnT-jO9aIXwxaGURxdhoVWd4kDuTvg",
  authDomain: "brain-fingerprinting-simulate.firebaseapp.com",
  projectId: "brain-fingerprinting-simulate",
  storageBucket: "brain-fingerprinting-simulate.appspot.com",
  messagingSenderId: "390151680124",
  appId: "1:390151680124:web:650ea243b91b3d3a5759f9"
};

// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);

// 🔹 Initialize Firestore & Auth
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 🔹 Export for use in other modules
export { app, db, auth, provider, signInWithPopup, signOut, onAuthStateChanged };

