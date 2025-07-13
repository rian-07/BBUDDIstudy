import { auth } from '/BBUDDIstudy/js/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();

let studyStartTime = null;
let studyInterval = null;

// 현재 공부 시간 초 단위로 계산
function getElapsedSeconds() {
  return Math.floor((Date.now() - studyStartTime) / 1000);
}

// HH:MM:SS 포맷
function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

function startStudyTimer() {
  studyStartTime = Date.now();

  studyInterval = setInterval(() => {
    const elapsed = getElapsedSeconds();
    document.getElementById('current-study-time').textContent = formatTime(elapsed);
  }, 1000);
}

function stopStudyTimer() {
  if (studyInterval) {
    clearInterval(studyInterval);
    studyInterval = null;
  }
}

// Firestore에 저장
async function saveStudyLog(uid, seconds) {
  const now = new Date();
  const dateKey = now.getHours() < 5 ? new Date(now.setDate(now.getDate() - 1)) : now;
  const key = dateKey.toISOString().slice(0, 10); // yyyy-mm-dd

  const startDate = new Date(studyStartTime);
  const startTimeStr = startDate.toTimeString().slice(0, 8);
  const endTimeStr = new Date().toTimeString().slice(0, 8);

  const docRef = doc(db, 'users', uid, 'studyLogs', key);
  await setDoc(docRef, {
    startTime: startTimeStr,
    endTime: endTimeStr,
    seconds: seconds
  }, { merge: true });
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "/BBUDDIstudy/index.html";
    return;
  }

  // 타이머 시작
  startStudyTimer();

  // 공부 끝내기
  const endBtn = document.getElementById("end-study-btn");
  endBtn.addEventListener("click", async () => {
    const seconds = getElapsedSeconds();
    stopStudyTimer();
    await saveStudyLog(user.uid, seconds);
    alert("공부 기록이 저장되었습니다!");
    window.location.href = "/BBUDDIstudy/home.html";
  });

  // 뽀모도로 타이머
  let pomoTime = 25 * 60;
  let pomoInterval = null;

  const pomoEl = document.getElementById("pomodoro-timer");
  const startBtn = document.getElementById("start-pomo-btn");
  const pauseBtn = document.getElementById("pause-pomo-btn");
  const resetBtn = document.getElementById("reset-pomo-btn");

  function updatePomoDisplay() {
    const m = String(Math.floor(pomoTime / 60)).padStart(2, '0');
    const s = String(pomoTime % 60).padStart(2, '0');
    pomoEl.textContent = `${m}:${s}`;
  }

  startBtn.addEventListener("click", () => {
    if (!pomoInterval) {
      pomoInterval = setInterval(() => {
        pomoTime--;
        if (pomoTime <= 0) {
          clearInterval(pomoInterval);
          pomoInterval = null;
          alert("뽀모도로 타이머 종료!");
        }
        updatePomoDisplay();
      }, 1000);
    }
  });

  pauseBtn.addEventListener("click", () => {
    clearInterval(pomoInterval);
    pomoInterval = null;
  });

  resetBtn.addEventListener("click", () => {
    clearInterval(pomoInterval);
    pomoInterval = null;
    pomoTime = 25 * 60;
    updatePomoDisplay();
  });

  updatePomoDisplay();
});
