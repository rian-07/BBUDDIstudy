// Firebase 초기화
const firebaseConfig = {
  apiKey: "AIzaSyAhdJZcG-4p4D2dT5K5QaPo5OLzShS2krw",
  authDomain: "bbuddistudy.firebaseapp.com",
  projectId: "bbuddistudy",
  storageBucket: "bbuddistudy.appspot.com",
  messagingSenderId: "154303839611",
  appId: "1:154303839611:web:7b7c806b002850138991de"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.getAuth(app);

// 로그인 처리 (index.html)
if (window.location.pathname.includes('index.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.getElementById('loginBtn');
    const signupLink = document.getElementById('signupBtn'); // 버튼이 아니라 링크나 버튼일 수 있음

    loginBtn?.addEventListener('click', () => {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();

      if (!email || !password) {
        alert('이메일과 비밀번호를 입력해주세요.');
        return;
      }

      firebase.signInWithEmailAndPassword(auth, email, password)
        .then(() => {
          window.location.href = 'home.html';
        })
        .catch((error) => {
          alert(`로그인 실패: ${error.message}`);
        });
    });

    signupLink?.addEventListener('click', () => {
      window.location.href = 'signup.html';
    });
  });
}

// 회원가입 처리 (signup.html)
if (window.location.pathname.includes('signup.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    const signupBtn = document.getElementById('signupBtn');

    signupBtn?.addEventListener('click', () => {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();

      if (!email || !password) {
        alert('이메일과 비밀번호를 입력해주세요.');
        return;
      }

      firebase.createUserWithEmailAndPassword(auth, email, password)
        .then(() => {
          alert('회원가입 성공! 로그인 페이지로 이동합니다.');
          window.location.href = 'index.html';
        })
        .catch((error) => {
          alert(`회원가입 실패: ${error.message}`);
        });
    });
  });
}
