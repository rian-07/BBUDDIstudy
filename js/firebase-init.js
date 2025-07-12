import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAhdJZcG-4p4D2dT5K5QaPo5OLzShS2krw",
  authDomain: "bbuddistudy.firebaseapp.com",
  projectId: "bbuddistudy",
  storageBucket: "bbuddistudy.appspot.com",
  messagingSenderId: "154303839611",
  appId: "1:154303839611:web:7b7c806b002850138991de"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
export { auth };

function signUp(email, password) {
  createUserWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      console.log('회원가입 성공:', userCredential.user);
    })
    .catch(error => {
      console.error('회원가입 실패:', error.code, error.message);
    });
}
