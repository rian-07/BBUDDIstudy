<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"></script>

<script>
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

  // 로그인 버튼, 회원가입 버튼 DOM
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  // 로그인 함수
  loginBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      alert('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    firebase.signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        window.location.href = 'home.html'; // 로그인 성공 시 홈화면 이동
      })
      .catch((error) => {
        alert(`로그인 실패: ${error.message}`);
      });
  });

  // 회원가입 함수
  signupBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      alert('회원가입을 위해 이메일과 비밀번호를 입력해주세요.');
      return;
    }

    firebase.createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        alert('회원가입 성공! 로그인 후 이용해주세요.');
      })
      .catch((error) => {
        alert(`회원가입 실패: ${error.message}`);
      });
  });
</script>
