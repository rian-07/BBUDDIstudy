import { auth } from '/BBUDDIstudy/js/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();

const startHourInput = document.getElementById('start-hour');
const startMinInput = document.getElementById('start-min');
const startSecInput = document.getElementById('start-sec');

const endHourInput = document.getElementById('end-hour');
const endMinInput = document.getElementById('end-min');
const endSecInput = document.getElementById('end-sec');

const totalTimeDisplay = document.getElementById('total-time');
const saveBtn = document.getElementById('save-records-btn');

let record = {
  startHour: 9, startMin: 0, startSec: 0,
  endHour: 10, endMin: 0, endSec: 0,
  seconds: 3600
};

function getTodayKey() {
  const now = new Date();
  if (now.getHours() < 5) now.setDate(now.getDate() - 1);
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2,'0');
  const d = now.getDate().toString().padStart(2,'0');
  return `${y}-${m}-${d}`;
}

function formatSeconds(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2,'0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2,'0');
  const s = (totalSeconds % 60).toString().padStart(2,'0');
  return `${h}:${m}:${s}`;
}

// 화면에 값을 표시하고 총 공부 시간 계산
function renderRecord() {
  startHourInput.value = record.startHour;
  startMinInput.value = record.startMin;
  startSecInput.value = record.startSec;

  endHourInput.value = record.endHour;
  endMinInput.value = record.endMin;
  endSecInput.value = record.endSec;

  updateTotalSeconds();
}

// 시간 입력값 변경될 때마다 총 공부 시간 갱신
function updateTotalSeconds() {
  const sh = Number(startHourInput.value);
  const sm = Number(startMinInput.value);
  const ss = Number(startSecInput.value);
  const eh = Number(endHourInput.value);
  const em = Number(endMinInput.value);
  const es = Number(endSecInput.value);

  const startTotal = sh*3600 + sm*60 + ss;
  const endTotal = eh*3600 + em*60 + es;
  let diff = endTotal - startTotal;
  if(diff < 0) diff = 0;

  record.seconds = diff;
  totalTimeDisplay.textContent = formatSeconds(diff);
}

// 오늘 기록 불러오기
async function loadRecord(uid) {
  const todayKey = getTodayKey();
  const docRef = doc(db, 'users', uid, 'studyLogs', todayKey);
  const docSnap = await getDoc(docRef);

  if(docSnap.exists()) {
    const data = docSnap.data();
    const startArr = (data.startTime || "09:00:00").split(':').map(Number);
    const endArr = (data.endTime || "10:00:00").split(':').map(Number);

    record = {
      startHour: startArr[0], startMin: startArr[1], startSec: startArr[2],
      endHour: endArr[0], endMin: endArr[1], endSec: endArr[2],
      seconds: data.seconds || 0
    };
  }
  renderRecord();
}

// 기록 저장
async function saveRecord(uid) {
  const todayKey = getTodayKey();
  const docRef = doc(db, 'users', uid, 'studyLogs', todayKey);

  const startTimeStr = `${String(record.startHour).padStart(2,'0')}:${String(record.startMin).padStart(2,'0')}:${String(record.startSec).padStart(2,'0')}`;
  const endTimeStr = `${String(record.endHour).padStart(2,'0')}:${String(record.endMin).padStart(2,'0')}:${String(record.endSec).padStart(2,'0')}`;

  await setDoc(docRef, {
    startTime: startTimeStr,
    endTime: endTimeStr,
    seconds: record.seconds
  }, {merge: true});

  alert('기록이 저장되었습니다!');
}

onAuthStateChanged(auth, async user => {
  if(!user) {
    window.location.href = '/BBUDDIstudy/index.html';
    return;
  }
  await loadRecord(user.uid);
});

// 인풋 변화 이벤트 등록
[startHourInput, startMinInput, startSecInput, endHourInput, endMinInput, endSecInput].forEach(input => {
  input.addEventListener('change', updateTotalSeconds);
});

saveBtn.addEventListener('click', async () => {
  const user = auth.currentUser;
  if(!user) return alert('로그인 상태가 아닙니다.');

  // 인풋값을 record에 반영
  record.startHour = Number(startHourInput.value);
  record.startMin = Number(startMinInput.value);
  record.startSec = Number(startSecInput.value);
  record.endHour = Number(endHourInput.value);
  record.endMin = Number(endMinInput.value);
  record.endSec = Number(endSecInput.value);

  await saveRecord(user.uid);
});
