import { auth } from '/BBUDDIstudy/js/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();
const recordListEl = document.getElementById('record-list');
const datePickerEl = document.getElementById('record-date-picker'); // 날짜 선택 input
const saveBtn = document.getElementById('save-records-btn');
const addRecordBtn = document.getElementById('add-record-btn'); // 기록 추가 버튼

let records = []; // 현재 선택된 날짜의 기록들

// 날짜를 YYYY-MM-DD 형식으로 반환 (새벽 5시 기준)
function getFormattedDate(date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// 초기 로드 시 오늘 날짜로 설정
function setInitialDate() {
    const now = new Date();
    // 00:00부터 04:59까지는 전날로 간주
    if (now.getHours() < 5) {
        now.setDate(now.getDate() - 1);
    }
    datePickerEl.value = getFormattedDate(now);
}

// 초를 시:분:초 형식으로 포맷
function formatSeconds(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}시간 ${m}분 ${s}초`; // 'HH시 MM분 SS초' 형식으로 변경
}

// 시간 입력 필드 변경 시 총 시간 업데이트
function updateRecordSeconds(idx) {
    const rec = records[idx];
    const sh = Number(document.getElementById(`start-hour-${idx}`).value);
    const sm = Number(document.getElementById(`start-min-${idx}`).value);
    const ss = Number(document.getElementById(`start-sec-${idx}`).value);
    const eh = Number(document.getElementById(`end-hour-${idx}`).value);
    const em = Number(document.getElementById(`end-min-${idx}`).value);
    const es = Number(document.getElementById(`end-sec-${idx}`).value);

    // Date 객체를 사용하여 시간 차이 계산 (날짜 넘김 고려)
    const startDate = new Date(datePickerEl.value + 'T' + String(sh).padStart(2, '0') + ':' + String(sm).padStart(2, '0') + ':' + String(ss).padStart(2, '0'));
    let endDate = new Date(datePickerEl.value + 'T' + String(eh).padStart(2, '0') + ':' + String(em).padStart(2, '0') + ':' + String(es).padStart(2, '0'));

    // 종료 시간이 시작 시간보다 빠르면 다음 날로 간주
    if (endDate.getTime() < startDate.getTime()) {
        endDate.setDate(endDate.getDate() + 1);
    }

    const diffMs = endDate.getTime() - startDate.getTime();
    const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

    rec.startHour = sh;
    rec.startMin = sm;
    rec.startSec = ss;
    rec.endHour = eh;
    rec.endMin = em;
    rec.endSec = es;
    rec.seconds = diffSeconds;

    document.getElementById(`seconds-${idx}`).textContent = formatSeconds(diffSeconds);
}

// 기록 렌더링 (UI에 표시)
function renderRecords() {
    recordListEl.innerHTML = ''; // 기존 내용 초기화

    if (records.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.textContent = '오늘 기록이 없습니다.';
        emptyMsg.style.textAlign = 'center';
        emptyMsg.style.color = '#888';
        recordListEl.appendChild(emptyMsg);
        return;
    }

    // 시작 시간 기준으로 정렬
    records.sort((a, b) => {
        const timeA = a.startHour * 3600 + a.startMin * 60 + a.startSec;
        const timeB = b.startHour * 3600 + b.startMin * 60 + b.startSec;
        return timeA - timeB;
    });

    records.forEach((rec, idx) => {
        const li = document.createElement('li');
        li.className = 'record-item';

        li.innerHTML = `
            <div class="record-display">
                <p>시작 시간: 
                    <input type="number" id="start-hour-${idx}" min="0" max="23" value="${rec.startHour.toString().padStart(2, '0')}" class="time-input" /> 시
                    <input type="number" id="start-min-${idx}" min="0" max="59" value="${rec.startMin.toString().padStart(2, '0')}" class="time-input" /> 분
                    <input type="number" id="start-sec-${idx}" min="0" max="59" value="${rec.startSec.toString().padStart(2, '0')}" class="time-input" /> 초
                </p>
                <p>종료 시간: 
                    <input type="number" id="end-hour-${idx}" min="0" max="23" value="${rec.endHour.toString().padStart(2, '0')}" class="time-input" /> 시
                    <input type="number" id="end-min-${idx}" min="0" max="59" value="${rec.endMin.toString().padStart(2, '0')}" class="time-input" /> 분
                    <input type="number" id="end-sec-${idx}" min="0" max="59" value="${rec.endSec.toString().padStart(2, '0')}" class="time-input" /> 초
                </p>
                <p>총 공부 시간: <span id="seconds-${idx}">${formatSeconds(rec.seconds)}</span></p>
            </div>
            <hr>
        `;
        recordListEl.appendChild(li);

        // input 변경 이벤트 리스너 추가
        ['hour', 'min', 'sec'].forEach(unit => {
            document.getElementById(`start-${unit}-${idx}`).addEventListener('change', () => updateRecordSeconds(idx));
            document.getElementById(`end-${unit}-${idx}`).addEventListener('change', () => updateRecordSeconds(idx));
        });
    });
}

// Firestore에서 기록 불러오기
async function loadRecords(uid) {
    const selectedDate = datePickerEl.value; // 현재 선택된 날짜
    if (!selectedDate) {
        recordListEl.innerHTML = '<p style="text-align: center; color: #888;">날짜를 선택해주세요.</p>';
        return;
    }

    const colRef = collection(db, 'users', uid, 'studyLogs');
    const snapshot = await getDocs(colRef);
    records = [];

    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        // 선택된 날짜와 기록의 'day' 필드(날짜 정보)가 일치하는지 확인
        if (data.day === selectedDate && data.startTime && data.endTime) {
            const startArr = data.startTime.split(':').map(Number);
            const endArr = data.endTime.split(':').map(Number);
            const seconds = data.seconds || 0;

            records.push({
                id: docSnap.id, // 문서 ID 저장
                startHour: startArr[0], startMin: startArr[1], startSec: startArr[2],
                endHour: endArr[0], endMin: endArr[1], endSec: endArr[2],
                seconds: seconds
            });
        }
    });

    renderRecords();
}

// Firestore에 기록 저장 (업데이트)
async function saveRecords(uid) {
    if (records.length === 0) {
        alert('저장할 기록이 없습니다.');
        return;
    }

    const selectedDate = datePickerEl.value;
    const updates = records.map(async rec => {
        const docRef = doc(db, 'users', uid, 'studyLogs', rec.id); // 기존 문서 ID 사용
        const start = `${String(rec.startHour).padStart(2, '0')}:${String(rec.startMin).padStart(2, '0')}:${String(rec.startSec).padStart(2, '0')}`;
        const end = `${String(rec.endHour).padStart(2, '0')}:${String(rec.endMin).padStart(2, '0')}:${String(rec.endSec).padStart(2, '0')}`;

        await setDoc(docRef, {
            day: selectedDate, // 기록의 날짜 필드도 업데이트
            startTime: start,
            endTime: end,
            seconds: rec.seconds
        }, { merge: true }); // merge: true를 사용하여 기존 필드는 유지하고 지정된 필드만 업데이트
    });

    await Promise.all(updates);
}

// 새로운 기록 추가 (UI에만 추가, 저장 버튼 누르기 전까지 Firebase에 반영 안됨)
function addNewRecord() {
    const selectedDate = datePickerEl.value;
    if (!selectedDate) {
        alert('기록을 추가할 날짜를 먼저 선택해주세요.');
        return;
    }

    // 현재 시간을 기본 값으로 설정
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentSec = now.getSeconds();

    // 새로운 기록 객체 생성 (임시 ID 부여)
    const newRecordId = 'new-' + Date.now(); // 고유한 임시 ID
    records.push({
        id: newRecordId,
        startHour: currentHour,
        startMin: currentMin,
        startSec: currentSec,
        endHour: currentHour, // 초기에는 시작 시간과 동일하게 설정
        endMin: currentMin,
        endSec: currentSec,
        seconds: 0
    });

    renderRecords(); // UI 갱신
}

// 인증 상태 변경 감지
onAuthStateChanged(auth, async user => {
    if (!user) {
        // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
        return location.href = '/BBUDDIstudy/index.html';
    }
    // 로그인된 경우 초기 날짜 설정 및 해당 날짜 기록 로드
    setInitialDate();
    await loadRecords(user.uid);
});

// 날짜 선택 변경 이벤트
datePickerEl.addEventListener('change', async () => {
    const user = auth.currentUser;
    if (user) {
        await loadRecords(user.uid);
    }
});

// 기록 저장 버튼 클릭 이벤트
saveBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) {
        alert('로그인이 필요합니다.');
        return;
    }
    await saveRecords(user.uid);
    alert('기록이 저장되었습니다!');
    // 저장 후 홈 페이지로 리다이렉트
    location.href = '/BBUDDIstudy/home.html';
});

// 기록 추가 버튼 클릭 이벤트
addRecordBtn.addEventListener('click', addNewRecord);
