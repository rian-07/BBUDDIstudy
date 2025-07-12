import { auth } from '/BBUDDIstudy/js/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();
const studyTimeEl = document.getElementById('study-time');
const todoListEl = document.getElementById('todo-list');

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = '/BBUDDIstudy/index.html';
    return;
  }

  // 🔹 1. 오늘 공부 시간 표시
  const todayKey = getTodayKey();
  const logRef = doc(db, 'users', user.uid, 'studyLogs', todayKey);
  const logSnap = await getDoc(logRef);
  const seconds = logSnap.exists() ? (logSnap.data().seconds || 0) : 0;
  studyTimeEl.textContent = formatSeconds(seconds);

  // 🔹 2. 오늘 할 일 목록 표시
  const todoColRef = collection(db, 'users', user.uid, 'todos');
  const todoSnap = await getDocs(todoColRef);

  todoListEl.innerHTML = '';
  todoSnap.forEach(doc => {
    const li = document.createElement('li');
    li.textContent = doc.data().text;
    todoListEl.appendChild(li);
  });
});

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

function formatSeconds(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}
