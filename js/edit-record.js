import { auth } from '/BBUDDIstudy/js/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();
const recordListEl = document.getElementById('record-list');
const saveBtn = document.getElementById('save-records-btn');

let records = [];

function getTodayKey() {
  const now = new Date();
  if (now.getHours() < 5) now.setDate(now.getDate() - 1);
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

function updateRecordSeconds(idx) {
  const rec = records[idx];
  const sh = Number(document.getElementById(`start-hour-${idx}`).value);
  const sm = Number(document.getElementById(`start-min-${idx}`).value);
  const ss = Number(document.getElementById(`start-sec-${idx}`).value);
  const eh = Number(document.getElementById(`end-hour-${idx}`).value);
  const em = Number(document.getElementById(`end-min-${idx}`).value);
  const es = Number(document.getElementById(`end-sec-${idx}`).value);

  const startTotal = sh * 3600 + sm * 60 + ss;
  const endTotal = eh * 3600 + em * 60 + es;
  const diff = Math.max(0, endTotal - startTotal);

  rec.startHour = sh;
  rec.startMin = sm;
  rec.startSec = ss;
  rec.endHour = eh;
  rec.endMin = em;
  rec.endSec = es;
  rec.seconds = diff;

  document.getElementById(`seconds-${idx}`).textContent = formatSeconds(diff);
}

function renderRecords() {
  recordListEl.innerHTML = '';

  if (records.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.textContent = '오늘 기록이 없습니다.';
    emptyMsg.style.textAlign = 'center';
    emptyMsg.style.color = '#888';
    recordListEl.appendChild(emptyMsg);
    return;
  }

  records.forEach((rec, idx) => {
    const li = document.createElement('li');
    li.className = 'record-item';

    li.innerHTML = `
      <label>시작 시간:
        <input type="number" id="start-hour-${idx}" min="0" max="23" value="${rec.startHour}" /> 시
        <input type="number" id="start-min-${idx}" min="0" max="59" value="${rec.startMin}" /> 분
        <input type="number" id="start-sec-${idx}" min="0" max="59" value="${rec.startSec}" /> 초
      </label>
      <label>종료 시간:
        <input type="number" id="end-hour-${idx}" min="0" max="23" value="${rec.endHour}" /> 시
        <input type="number" id="end-min-${idx}" min="0" max="59" value="${rec.endMin}" /> 분
        <input type="number" id="end-sec-${idx}" min="0" max="59" value="${rec.endSec}" /> 초
      </label>
      <p>총 시간: <span id="seconds-${idx}">${formatSeconds(rec.seconds)}</span></p>
    `;

    recordListEl.appendChild(li);

    ['hour', 'min', 'sec'].forEach(unit => {
      document.getElementById(`start-${unit}-${idx}`).addEventListener('change', () => updateRecordSeconds(idx));
      document.getElementById(`end-${unit}-${idx}`).addEventListener('change', () => updateRecordSeconds(idx));
    });
  });
}

async function loadRecords(uid) {
  const colRef = collection(db, 'users', uid, 'studyLogs');
  const snapshot = await getDocs(colRef);
  records = [];

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (!data.startTime || !data.endTime) return;
    const startArr = data.startTime.split(':').map(Number);
    const endArr = data.endTime.split(':').map(Number);
    const seconds = data.seconds || 0;

    records.push({
      id: docSnap.id,
      startHour: startArr[0], startMin: startArr[1], startSec: startArr[2],
      endHour: endArr[0], endMin: endArr[1], endSec: endArr[2],
      seconds
    });
  });

  renderRecords();
}

async function saveRecords(uid) {
  const updates = records.map(async rec => {
    const docRef = doc(db, 'users', uid, 'studyLogs', rec.id);
    const start = `${String(rec.startHour).padStart(2, '0')}:${String(rec.startMin).padStart(2, '0')}:${String(rec.startSec).padStart(2, '0')}`;
    const end = `${String(rec.endHour).padStart(2, '0')}:${String(rec.endMin).padStart(2, '0')}:${String(rec.endSec).padStart(2, '0')}`;

    await setDoc(docRef, {
      startTime: start,
      endTime: end,
      seconds: rec.seconds
    }, { merge: true });
  });

  await Promise.all(updates);
}

onAuthStateChanged(auth, async user => {
  if (!user) return location.href = '/BBUDDIstudy/index.html';
  await loadRecords(user.uid);
});

saveBtn.addEventListener('click', async () => {
  const user = auth.currentUser;
  if (!user) return alert('로그인이 필요합니다.');
  await saveRecords(user.uid);
  alert('기록이 저장되었습니다!');
  location.href = '/BBUDDIstudy/home.html';
});
