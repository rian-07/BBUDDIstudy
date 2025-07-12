import { auth } from '/BBUDDIstudy/js/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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

  endStudyBtn.addEventListener('click', () => {
    clearInterval(studyInterval);
    // TODO: 공부 시간 Firebase에 저장 로직 추가 가능
    window.location.href = '/BBUDDIstudy/home.html';
  });

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

  /* 로그인 확인 */
  onAuthStateChanged(auth, user => {
    if (!user) {
      window.location.href = '/BBUDDIstudy/index.html';
    }
  });
});
