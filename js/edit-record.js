import { auth } from '/BBUDDIstudy/js/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();

const recordListEl = document.getElementById('record-list');
const saveBtn = document.getElementById('save-record-btn');

let records = []; // { id, dateKey, seconds }

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = '/BBUDDIstudy/index.html';
    return;
  }

  await loadRecords(user.uid);
  renderRecords();
});

async function loadRecords(uid) {
  records = [];
  const colRef = collection(db, 'users', uid, 'studyLogs');
  const snapshot = await getDocs(colRef);

  snapshot.forEach(docSnap => {
    records.push({
      id: docSnap.id,
      dateKey: docSnap.id,
      seconds: docSnap.data().seconds || 0
    });
  });

  // 날짜 내림차순 정렬 (최근 날짜부터 보이도록)
  records.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

function renderRecords() {
  recordListEl.innerHTML = '';

  records.forEach((record, idx) => {
    const div = document.createElement('div');
    div.className = 'record-item';

    const label = document.createElement('label');
    label.textContent = record.dateKey;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = formatSeconds(record.seconds);
    input.dataset.idx = idx;

    // 숫자만 입력하도록 필터 (시간 형식 HH:MM:SS가 아니어도 됨)
    input.addEventListener('input', () => {
      // 간단한 숫자만 받도록: 나중에 포맷 변환 필요 시 확장 가능
      input.value = input.value.replace(/[^0-9]/g, '');
    });

    div.appendChild(label);
    div.appendChild(input);
    recordListEl.appendChild(div);
  });
}

saveBtn.addEventListener('click', async () => {
  // 입력값을 초 단위로 변환해서 저장
  const inputs = recordListEl.querySelectorAll('input');
  inputs.forEach((input, idx) => {
    let sec = parseInt(input.value, 10);
    if (isNaN(sec) || sec < 0) sec = 0;
    records[idx].seconds = sec;
  });

  const user = auth.currentUser;
  if (!user) return alert('로그인 상태가 아닙니다.');

  const promises = records.map(record => {
    const docRef = doc(db, 'users', user.uid, 'studyLogs', record.dateKey);
    return setDoc(docRef, { seconds: record.seconds });
  });

  await Promise.all(promises);
  alert('기록이 저장되었습니다!');
  window.location.href = '/BBUDDIstudy/home.html';
});

function formatSeconds(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}
