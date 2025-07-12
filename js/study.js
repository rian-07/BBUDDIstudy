import { auth } from '/BBUDDIstudy/js/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();

window.addEventListener('DOMContentLoaded', () => {
  const currentStudyTimeEl = document.getElementById('current-study-time');
  const endStudyBtn = document.getElementById('end-study-btn');

  let studyStartTime = Date.now();

  function updateStudyTime() {
    const elapsed = Date.now() - studyStartTime;
    const totalSeconds = Math.floor(elapsed / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    currentStudyTimeEl.textContent = `${hours}:${minutes}:${seconds}`;
  }

  let studyInterval = setInterval(updateStudyTime, 1000);

  endStudyBtn.addEventListener('click', async () => {
    clearInterval(studyInterval);
    const user = auth.currentUser;
    if (!user) return;

    const studyEndTime = Date.now();
    const elapsed = studyEndTime - studyStartTime;
    const elapsedSeconds = Math.floor(elapsed / 1000);

    const todayKey = getTodayKey(); // 새벽 5시 기준 날짜 구하기
    const logRef = doc(db, 'users', user.uid, 'studyLogs', todayKey);
    const logSnap = await getDoc(logRef);
    const prevTime = logSnap.exists() ? (logSnap.data().seconds || 0) : 0;

    await setDoc(logRef, {
      seconds: prevTime + elapsedSeconds
    });

    window.location.href = '/BBUDDIstudy/home.html';
  });

  function getTodayKey() {
    const now = new Date();
    if (now.getHours() < 5) {
      now.setDate(now.getDate() - 1);
    }
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`; // e.g. '2025-07-12'
  }

  // --- 뽀모도로 타이머 부분 ---
  const pomoTimerEl = document.getElementById('pomodoro-timer');
  const startPomoBtn = document.getElementById('start-pomo-btn');
  const pausePomoBtn = document.getElementById('pause-pomo-btn');
  const resetPomoBtn = document.getElementById('reset-pomo-btn');

  let pomoTotalSeconds = 25 * 60;
  let pomoInterval = null;
  let pomoRunning = false;

  function updatePomoDisplay() {
    const m = Math.floor(pomoTotalSeconds / 60).toString().padStart(2, '0');
    const s = (pomoTotalSeconds % 60).toString().padStart(2, '0');
    pomoTimerEl.textContent = `${m}:${s}`;
  }

  function startPomo() {
    if (pomoRunning) return;
    pomoRunning = true;
    pomoInterval = setInterval(() => {
      if (pomoTotalSeconds > 0) {
        pomoTotalSeconds--;
        updatePomoDisplay();
      } else {
        clearInterval(pomoInterval);
        pomoRunning = false;
        alert('뽀모도로 완료!');
      }
    }, 1000);
  }

  function pausePomo() {
    if (!pomoRunning) return;
    clearInterval(pomoInterval);
    pomoRunning = false;
  }

  function resetPomo() {
    clearInterval(pomoInterval);
    pomoTotalSeconds = 25 * 60;
    updatePomoDisplay();
    pomoRunning = false;
  }

  startPomoBtn.addEventListener('click', startPomo);
  pausePomoBtn.addEventListener('click', pausePomo);
  resetPomoBtn.addEventListener('click', resetPomo);

  updatePomoDisplay();

  onAuthStateChanged(auth, user => {
    if (!user) {
      window.location.href = '/BBUDDIstudy/index.html';
    }
  });
});
