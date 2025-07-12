// home.js
import { auth } from '/BBUDDIstudy/js/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();

// 버튼 요소 가져오기
const startStudyBtn = document.getElementById('start-study-btn');
const editRecordBtn = document.getElementById('edit-record-btn');
const editTodoBtn = document.getElementById('edit-todo-btn');
const studyTimeEl = document.getElementById('study-time');
const todoListEl = document.getElementById('todo-list');

// ✅ 버튼 클릭 이벤트
startStudyBtn?.addEventListener('click', () => {
  window.location.href = '/BBUDDIstudy/study.html';
});

editRecordBtn?.addEventListener('click', () => {
  window.location.href = '/BBUDDIstudy/edit-record.html';
});

editTodoBtn?.addEventListener('click', () => {
  window.location.href = '/BBUDDIstudy/todo-edit.html';
});

// ✅ 로그인 상태 확인 및 정보 불러오기
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = '/BBUDDIstudy/index.html';
    return;
  }

  // 🔹 오늘 공부 시간 불러오기
  const todayKey = getTodayKey();
  const logRef = doc(db, 'users', user.uid, 'studyLogs', todayKey);
  const logSnap = await getDoc(logRef);
  const seconds = logSnap.exists() ? (logSnap.data().seconds || 0) : 0;
  studyTimeEl.textContent = formatSeconds(seconds);

  // 🔹 오늘 할 일 목록 불러오기
  const todoColRef = collection(db, 'users', user.uid, 'todos');
  const todoSnap = await getDocs(todoColRef);

  todoListEl.innerHTML = '';
  todoSnap.forEach(doc => {
    const li = document.createElement('li');
    li.textContent = doc.data().text;
    todoListEl.appendChild(li);
  });
});

// ✅ 새벽 5시 기준 날짜 반환
function getTodayKey() {
  const now = new Date();
  if (now.getHours() < 5) {
    now.setDate(now.getDate() - 1);
  }
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ✅ 초 단위를 HH:MM:SS로 변환
function formatSeconds(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}
