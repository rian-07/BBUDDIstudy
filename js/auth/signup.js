import { auth } from "/BBUDDIstudy/js/firebase-init.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.getElementById("signup-btn").addEventListener("click", () => {
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const passwordConfirm = document.getElementById("signup-password-confirm").value;

  if (!email || !password || !passwordConfirm) {
    alert("모든 항목을 입력해주세요.");
    return;
  }

  if (password !== passwordConfirm) {
    alert("비밀번호가 일치하지 않습니다.");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("회원가입 성공! 로그인 화면으로 이동합니다.");
      window.location.href = "/BBUDDIstudy/index.html";
    })
    .catch((error) => {
      alert("회원가입 실패: " + error.message);
    });
});

document.getElementById("go-login-btn").addEventListener("click", () => {
  window.location.href = "/BBUDDIstudy/index.html";
});
