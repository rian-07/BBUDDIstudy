import { auth } from '/BBUDDIstudy/js/firebase-init.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const userEmailDiv = document.getElementById('user-email');
const studyTimeDiv = document.getElementById('study-time');
const todoList = document.getElementById('todo-list');
const startBtn = document.getElementById('start-study-btn');

// 로그인 상태 감지
onAuthStateChanged(auth, (user) => {
  if (user) {
    userEmailDiv.textContent = `로그인한 사용자: ${user.email}`;
    // TODO: 누적 공부 시간, 할 일 목록 불러오기
  } else {
    // 로그인 안 됐으면 로그인 화면으로 이동
    window.location.href = '/BBUDDIstudy/index.html';
  }
});

startBtn.addEventListener('click', () => {
  window.location.href = '/BBUDDIstudy/study.html'; // 타이머 화면으로 이동
});
