import { auth } from '/BBUDDIstudy/js/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();

window.addEventListener('DOMContentLoaded', () => {
  const recordListEl = document.getElementById('record-list');
  const saveBtn = document.getElementById('save-records-btn');

  let records = []; // {id, startHour, startMin, startSec, endHour, endMin, endSec, seconds}

// 날짜 포맷 키 (yyyy-mm-dd)
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

// 초 -> HH:MM:SS 문자열 변환
function formatSeconds(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// 화면에 기록 목록 렌더링
function renderRecords() {
  recordListEl.innerHTML = '';
  records.forEach((rec, idx) => {
    const li = document.createElement('li');

    li.innerHTML = `
      <label>시작시간:
        <input type="number" id="start-hour-${idx}" min="0" max="23" value="${rec.startHour}" /> 시
        <input type="number" id="start-min-${idx}" min="0" max="59" value="${rec.startMin}" /> 분
        <input type="number" id="start-sec-${idx}" min="0" max="59" value="${rec.startSec}" /> 초
      </label>
      <label>종료시간:
        <input type="number" id="end-hour-${idx}" min="0" max="23" value="${rec.endHour}" /> 시
        <input type="number" id="end-min-${idx}" min="0" max="59" value="${rec.endMin}" /> 분
        <input type="number" id="end-sec-${idx}" min="0" max="59" value="${rec.endSec}" /> 초
      </label>
      <span>총 시간: <span id="sec-${idx}">${formatSeconds(rec.seconds)}</span></span>
    `;

    recordListEl.appendChild(li);

    // 각 인풋에 이벤트 등록 (변경 시 초 단위 계산 업데이트)
    ['hour', 'min', 'sec'].forEach(unit => {
      document.getElementById(`start-${unit}-${idx}`).addEventListener('change', () => updateRecordSeconds(idx));
      document.getElementById(`end-${unit}-${idx}`).addEventListener('change', () => updateRecordSeconds(idx));
    });
  });
}

// 기록 한 항목의 총 공부 시간(초) 계산 및 업데이트
function updateRecordSeconds(idx) {
  const startHour = Number(document.getElementById(`start-hour-${idx}`).value);
  const startMin = Number(document.getElementById(`start-min-${idx}`).value);
  const startSec = Number(document.getElementById(`start-sec-${idx}`).value);

  const endHour = Number(document.getElementById(`end-hour-${idx}`).value);
  const endMin = Number(document.getElementById(`end-min-${idx}`).value);
  const endSec = Number(document.getElementById(`end-sec-${idx}`).value);

  const startTotal = startHour * 3600 + startMin * 60 + startSec;
  const endTotal = endHour * 3600 + endMin * 60 + endSec;

  let diff = endTotal - startTotal;
  if (diff < 0) diff = 0;

  records[idx].seconds = diff;
  document.getElementById(`sec-${idx}`).textContent = formatSeconds(diff);
}

// Firebase에서 오늘 공부 기록 불러오기
async function loadRecords(uid) {
  const todayKey = getTodayKey();
  const colRef = collection(db, 'users', uid, 'studyLogs');
  const snapshot = await getDocs(colRef);

  // 오늘날짜 기록만 불러오기 (필요 시 조건 추가 가능)
  records = [];

  snapshot.forEach(docSnap => {
    if (docSnap.id === todayKey) {
      const d = docSnap.data();
      const startArr = (d.startTime || "09:00:00").split(':').map(Number);
      const endArr = (d.endTime || "10:00:00").split(':').map(Number);

      records.push({
        id: docSnap.id,
        startHour: startArr[0],
        startMin: startArr[1],
        startSec: startArr[2],
        endHour: endArr[0],
        endMin: endArr[1],
        endSec: endArr[2],
        seconds: d.seconds || 0
      });
    }
  });

  // 없으면 기본 하나 넣기
  if (records.length === 0) {
    records.push({
      id: null,
      startHour: 9, startMin: 0, startSec: 0,
      endHour: 10, endMin: 0, endSec: 0,
      seconds: 3600
    });
  }
  renderRecords();
}

// 기록 저장하기
async function saveRecords(uid) {
  const colRef = collection(db, 'users', uid, 'studyLogs');

  // 입력된 값들을 records 배열에 반영 (시간계산 포함)
  records.forEach((rec, idx) => {
    rec.startHour = Number(document.getElementById(`start-hour-${idx}`).value);
    rec.startMin = Number(document.getElementById(`start-min-${idx}`).value);
    rec.startSec = Number(document.getElementById(`start-sec-${idx}`).value);
    rec.endHour = Number(document.getElementById(`end-hour-${idx}`).value);
    rec.endMin = Number(document.getElementById(`end-min-${idx}`).value);
    rec.endSec = Number(document.getElementById(`end-sec-${idx}`).value);

    const startTotal = rec.startHour * 3600 + rec.startMin * 60 + rec.startSec;
    const endTotal = rec.endHour * 3600 + rec.endMin * 60 + rec.endSec;
    rec.seconds = Math.max(0, endTotal - startTotal);
  });

  // Firestore에 저장 (기본적으로 오늘 날짜 기준, id가 없으면 새로 만들기)
  await Promise.all(records.map(async rec => {
    const docRef = rec.id ? doc(db, 'users', auth.currentUser.uid, 'studyLogs', rec.id)
                        : doc(collection(db, 'users', auth.currentUser.uid, 'studyLogs'));

    const docData = {
      startTime: `${rec.startHour.toString().padStart(2,'0')}:${rec.startMin.toString().padStart(2,'0')}:${rec.startSec.toString().padStart(2,'0')}`,
      endTime: `${rec.endHour.toString().padStart(2,'0')}:${rec.endMin.toString().padStart(2,'0')}:${rec.endSec.toString().padStart(2,'0')}`,
      seconds: rec.seconds
    };

    await setDoc(docRef, docData, { merge: true });
  }));
}

onAuthStateChanged(auth, async (user) => {
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
});
