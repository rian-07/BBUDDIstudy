import { auth } from '/BBUDDIstudy/js/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();

const recordListEl = document.getElementById('record-list');
const saveBtn = document.getElementById('save-record-btn');

let records = []; // {id, startTime, endTime, seconds}

// 날짜 키 (오늘 기준, 5시 이전은 전날로)
function getTodayKey() {
  const now = new Date();
  if (now.getHours() < 5) now.setDate(now.getDate() - 1);
  const y = now.getFullYear();
  const m = (now.getMonth() +1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 시간 문자열(예: "14:30") → 초 변환
function timeStrToSeconds(t) {
  const [h,m] = t.split(':').map(Number);
  return h * 3600 + m * 60;
}

// 초 → "HH:MM:SS"
function formatSeconds(s) {
  const h = Math.floor(s/3600).toString().padStart(2,'0');
  const m = Math.floor((s%3600)/60).toString().padStart(2,'0');
  const sec = (s%60).toString().padStart(2,'0');
  return `${h}:${m}:${sec}`;
}

// 시작시간, 종료시간 input 값 바뀔 때마다 공부시간 업데이트
function updateRecordSeconds(idx) {
  const startInput = document.getElementById(`start-${idx}`);
  const endInput = document.getElementById(`end-${idx}`);
  const secSpan = document.getElementById(`sec-${idx}`);

  const startSec = timeStrToSeconds(startInput.value);
  const endSec = timeStrToSeconds(endInput.value);

  let diff = endSec - startSec;
  if (diff < 0) diff = 0;
  secSpan.textContent = formatSeconds(diff);
  records[idx].seconds = diff;
}

// 화면에 기록 렌더링
function renderRecords() {
  recordListEl.innerHTML = '';
  records.forEach((rec, idx) => {
    const li = document.createElement('li');

    li.innerHTML = `
      <input type="time" id="start-${idx}" value="${rec.startTime}" />
      <input type="time" id="end-${idx}" value="${rec.endTime}" />
      <span id="sec-${idx}">${formatSeconds(rec.seconds)}</span>
    `;

    recordListEl.appendChild(li);

    document.getElementById(`start-${idx}`).addEventListener('change', () => updateRecordSeconds(idx));
    document.getElementById(`end-${idx}`).addEventListener('change', () => updateRecordSeconds(idx));
  });
}

// 저장 버튼 클릭 시 Firestore에 저장
saveBtn.addEventListener('click', async () => {
  const user = auth.currentUser;
  if (!user) {
    alert('로그인이 필요합니다.');
    window.location.href = '/BBUDDIstudy/index.html';
    return;
  }

  const todayKey = getTodayKey();
  const colRef = collection(db, 'users', user.uid, 'studyLogs', todayKey);

  // 기존 데이터 모두 지우고 다시 저장 (간단 구현)
  const oldDocs = await getDocs(colRef);
  for (const docSnap of oldDocs.docs) {
    await doc(db, 'users', user.uid, 'studyLogs', todayKey, docSnap.id).delete();
  }

  // 새 기록 저장
  for (const rec of records) {
    await setDoc(doc(colRef, rec.id || undefined), {
      startTime: rec.startTime,
      endTime: rec.endTime,
      seconds: rec.seconds
    });
  }

  alert('기록이 저장되었습니다!');
  window.location.href = '/BBUDDIstudy/home.html';
});

// 로그인 상태 확인 및 초기 데이터 로드
onAuthStateChanged(auth, async user => {
  if (!user) {
    window.location.href = '/BBUDDIstudy/index.html';
    return;
  }

  const todayKey = getTodayKey();
  const colRef = collection(db, 'users', user.uid, 'studyLogs', todayKey);
  const snapshot = await getDocs(colRef);

  if (snapshot.empty) {
    // 초기 데이터가 없으면 빈 1개 항목 만들기
    records = [{
      id: undefined,
      startTime: '09:00',
      endTime: '10:00',
      seconds: 3600
    }];
  } else {
    records = snapshot.docs.map(docSnap => {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        startTime: d.startTime || '09:00',
        endTime: d.endTime || '10:00',
        seconds: d.seconds || 0
      };
    });
  }
  renderRecords();
});
