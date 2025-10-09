// firebase.js
// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// 🔑 Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDbKUnT-jO9aIXwxaGURxdhoVWd4kDuTvg",
  authDomain: "brain-fingerprinting-simulate.firebaseapp.com",
  projectId: "brain-fingerprinting-simulate",
  storageBucket: "brain-fingerprinting-simulate.appspot.com", // corrected
  messagingSenderId: "390151680124",
  appId: "1:390151680124:web:650ea243b91b3d3a5759f9",
  measurementId: "G-K6NEH10GWX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore & Storage
const db = getFirestore(app);
const storage = getStorage(app);

// Export to use in other files
export { db, storage };
