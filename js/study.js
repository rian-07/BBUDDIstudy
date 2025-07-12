const currentTimeDiv = document.getElementById('current-time');
const timerDisplay = document.getElementById('timer');
const timerInput = document.getElementById('timer-input');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');

let timerDuration = parseInt(timerInput.value) * 60; // 초 단위
let remainingTime = timerDuration;
let timerInterval = null;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(remainingTime);
}

function updateCurrentStudyTime() {
  // TODO: 공부 누적 시간 불러와서 표시할 자리
  // 지금은 그냥 00:00:00 표시
  currentTimeDiv.textContent = "00:00:00";
}

timerInput.addEventListener('change', () => {
  if (timerInterval) return; // 타이머 실행 중엔 변경 불가
  timerDuration = parseInt(timerInput.value) * 60;
  remainingTime = timerDuration;
  updateTimerDisplay();
});

startBtn.addEventListener('click', () => {
  if (timerInterval) return; // 이미 실행 중이면 무시

  timerInterval = setInterval(() => {
    remainingTime--;
    updateTimerDisplay();

    if (remainingTime <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      alert("타이머 종료!");
      startBtn.disabled = false;
      pauseBtn.disabled = true;
      resetBtn.disabled = false;
    }
  }, 1000);

  startBtn.disabled = true;
  pauseBtn.disabled = false;
  resetBtn.disabled = true;
});

pauseBtn.addEventListener('click', () => {
  if (!timerInterval) return;

  clearInterval(timerInterval);
  timerInterval = null;

  startBtn.disabled = false;
  pauseBtn.disabled = true;
  resetBtn.disabled = false;
});

resetBtn.addEventListener('click', () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  remainingTime = timerDuration;
  updateTimerDisplay();

  startBtn.disabled = false;
  pauseBtn.disabled = true;
  resetBtn.disabled = true;
});

updateTimerDisplay();
updateCurrentStudyTime();
