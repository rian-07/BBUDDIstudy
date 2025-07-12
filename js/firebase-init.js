// Firebase 모듈 import (필요한 것만)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAhdJZcG-4p4D2dT5K5QaPo5OLzShS2krw",
  authDomain: "bbuddistudy.firebaseapp.com",
  projectId: "bbuddistudy",
  storageBucket: "bbuddistudy.firebasestorage.app",
  messagingSenderId: "154303839611",
  appId: "1:154303839611:web:7b7c806b002850138991de",
  measurementId: "G-47SGQG1G20"
};

// Firebase 앱 초기화 (한 번만)
const app = initializeApp(firebaseConfig);

// 필요한 모듈 export
export const auth = getAuth(app);
export const db = getFirestore(app);
