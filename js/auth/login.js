import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const auth = getAuth();

document.getElementById("login-btn").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      // 로그인 성공 시 home 페이지로 이동
      window.location.href = "/BBUDDIstudy/home.html";
    })
    .catch((error) => {
      alert("로그인 실패: " + error.message);
    });
});

document.getElementById("go-signup-btn").addEventListener("click", () => {
  window.location.href = "/BBUDDIstudy/signup.html";
});
