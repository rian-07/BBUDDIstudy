import { auth } from '/BBUDDIstudy/js/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const studyTimeDiv = document.getElementById('study-time');
const todoList = document.getElementById('todo-list');
const startBtn = document.getElementById('start-study-btn');
const editTodoBtn = document.getElementById('edit-todo-btn');
const editRecordBtn = document.getElementById('edit-record-btn');

// 로그인 상태 감지
onAuthStateChanged(auth, (user) => {
  if (user) {
    // 사용자 로그인 상태일 때
    loadStudyTime(user.uid); // 나중에 구현
    loadTodoList(user.uid);  // 나중에 구현
  } else {
    // 로그인 안 되어 있으면 로그인 화면으로
    window.location.href = '/BBUDDIstudy/index.html';
  }
});

// 공부 시작 버튼 클릭 시
startBtn.addEventListener('click', () => {
  window.location.href = '/BBUDDIstudy/study.html';
});

// 기록 수정 버튼 클릭 시
editRecordBtn.addEventListener('click', () => {
  window.location.href = '/BBUDDIstudy/edit-record.html';
});

// 할 일 수정 버튼 클릭 시 (나중에 별도 페이지 연결 가능)
editTodoBtn.addEventListener('click', () => {
  window.location.href = '/BBUDDIstudy/edit-todo.html';
});
