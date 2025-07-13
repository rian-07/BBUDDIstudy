import { auth } from '/BBUDDIstudy/js/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();
const recordListEl = document.getElementById('record-list');
const saveBtn = document.getElementById('save-records-btn');

let records = []; // 여러 기록을 담을 배열

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

// 기록 렌더링
function renderRecords() {
  recordListEl.innerHTML = '';

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

function updateRecordSeconds(idx) {
  const sh = Number(document.getElementById(`start-hour-${idx}`).value);
  const sm = Number(document.getElementById(`start-min-${idx}`).value);
  const ss = Number(document.getElementById(`start-sec-${idx}`).value);
  const eh = Number(document.getElementById(`end-hour-${idx}`).value);
  const em = Number(document.getElementById(`end-min-${idx}`).value);
  const es = Number(document.getElementById(`end-sec-${idx}`).value);

  const startTotal = sh * 3600 + sm * 60 + ss;
  const endTotal = eh * 3600 + em * 60 + es;
  const diff = Math.max(0, endTotal - startTotal);

  records[idx] = {
    ...records[idx],
    startHour: sh, startMin: sm, startSec: ss,
    endHour: eh, endMin: em, endSec: es,
    seconds: diff
  };

  document.getElementById(`seconds-${idx}`).textContent = formatSeconds(diff);
}

async function loadRecords(uid) {
  const colRef = collection(db, 'users', uid, 'studyLogs');
  const snapshot = await getDocs(colRef);

  records = [];
  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    const startArr = d.startTime?.split(':').map(Number) || [9, 0, 0];
    const endArr = d.endTime?.split(':').map(Number) || [10, 0, 0];
    const seconds = d.seconds || 0;

    records.push({
      id: docSnap.id,
      startHour: startArr[0],
      startMin: startArr[1],
      startSec: startArr[2],
      endHour: endArr[0],
      endMin: endArr[1],
      endSec: endArr[2],
      seconds
    });
  });

  if (records.length === 0) {
    records.push({
      id: getTodayKey(),
      startHour: 9, startMin: 0, startSec: 0,
      endHour: 10, endMin: 0, endSec: 0,
      seconds: 3600
    });
  }

  renderRecords();
}

async function saveRecords(uid) {
  await Promise.all(records.map(async rec => {
    const docRef = doc(db, 'users', uid, 'studyLogs', rec.id);

    const start = `${String(rec.startHour).padStart(2, '0')}:${String(rec.startMin).padStart(2, '0')}:${String(rec.startSec).padStart(2, '0')}`;
    const end = `${String(rec.endHour).padStart(2, '0')}:${String(rec.endMin).padStart(2, '0')}:${String(rec.endSec).padStart(2, '0')}`;

    await setDoc(docRef, {
      startTime: start,
      endTime: end,
      seconds: rec.seconds
    }, { merge: true });
  }));
}

onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = '/BBUDDIstudy/index.html';
    return;
  }
  await loadRecords(user.uid);
});

saveBtn.addEventListener('click', async () => {
  const user = auth.currentUser;
  if (!user) return alert('로그인 상태가 아닙니다.');

  await saveRecords(user.uid);
  alert('기록이 저장되었습니다!');
  window.location.href = '/BBUDDIstudy/home.html';
});
