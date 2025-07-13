import { auth } from '/BBUDDIstudy/js/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
// deleteDoc을 추가로 import 합니다.
import { getFirestore, collection, getDocs, doc, setDoc, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
    return `${h}시간 ${m}분 ${s}초`;
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

    // 종료 시간이 시작 시간보다 빠르면 다음 날로 간주 (자정을 넘겼을 경우)
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

// ⭐ 새로 추가된 함수: 기록 삭제 ⭐
async function deleteRecord(uid, recordId) {
    if (!confirm('정말로 이 기록을 삭제하시겠습니까?')) {
        return; // 사용자가 취소하면 아무것도 하지 않음
    }

    try {
        const docRef = doc(db, 'users', uid, 'studyLogs', recordId);
        await deleteDoc(docRef); // Firebase에서 문서 삭제
        
        // UI에서 해당 기록 제거
        records = records.filter(rec => rec.id !== recordId);
        renderRecords(); // UI 다시 그리기

        alert('기록이 성공적으로 삭제되었습니다!');
    } catch (error) {
        console.error("기록 삭제 중 오류 발생:", error);
        alert("기록 삭제 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
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
                <button class="delete-record-btn" data-id="${rec.id}">삭제</button> </div>
            <hr>
        `;
        recordListEl.appendChild(li);

        // input 변경 이벤트 리스너 추가
        ['hour', 'min', 'sec'].forEach(unit => {
            document.getElementById(`start-${unit}-${idx}`).addEventListener('change', () => updateRecordSeconds(idx));
            document.getElementById(`end-${unit}-${idx}`).addEventListener('change', () => updateRecordSeconds(idx));
        });

        // ⭐ 삭제 버튼 이벤트 리스너 추가 ⭐
        const deleteBtn = li.querySelector('.delete-record-btn');
        deleteBtn.addEventListener('click', () => {
            const user = auth.currentUser;
            if (user) {
                deleteRecord(user.uid, rec.id); // deleteRecord 함수 호출
            } else {
                alert('로그인이 필요합니다.');
            }
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
    // 'day' 필드를 사용하여 특정 날짜의 기록만 쿼리합니다.
    const q = query(colRef, where('day', '==', selectedDate));
    const snapshot = await getDocs(q);
    records = []; // 기존 records 초기화

    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        // data.day 필드가 이미 쿼리로 필터링되었으므로 여기서는 추가 확인 불필요.
        // 다만, startTime과 endTime 필드가 유효한지 다시 확인하는 것이 좋습니다.
        if (data.startTime && data.endTime) {
            const startArr = data.startTime.split(':').map(Number);
            const endArr = data.endTime.split(':').map(Number);
            const seconds = data.seconds || 0;

            records.push({
                id: docSnap.id, // 문서 ID 저장 (삭제에 필요)
                startHour: startArr[0], startMin: startArr[1], startSec: startArr[2],
                endHour: endArr[0], endMin: endArr[1], endSec: endArr[2],
                seconds: seconds
            });
        }
    });

    renderRecords();
}

// Firestore에 기록 저장 (업데이트 또는 추가)
async function saveRecords(uid) {
    if (records.length === 0) {
        alert('저장할 기록이 없습니다.');
        return;
    }

    const selectedDate = datePickerEl.value;
    const updates = records.map(async rec => {
        const start = `${String(rec.startHour).padStart(2, '0')}:${String(rec.startMin).padStart(2, '0')}:${String(rec.startSec).padStart(2, '0')}`;
        const end = `${String(rec.endHour).padStart(2, '0')}:${String(rec.endMin).padStart(2, '0')}:${String(rec.endSec).padStart(2, '0')}`;

        // 'new-'로 시작하는 ID는 새로운 기록이므로 addDoc 사용
        if (rec.id && rec.id.startsWith('new-')) {
            const newDocRef = collection(db, 'users', uid, 'studyLogs');
            await addDoc(newDocRef, { // 새로운 문서 추가
                day: selectedDate, // 기록의 날짜 필드
                startTime: start,
                endTime: end,
                seconds: rec.seconds
            });
            // Firebase에 저장된 후, 임시 ID를 실제 Firebase 문서 ID로 업데이트
            // (화면을 다시 로드하면 자동으로 새 ID로 불러와지므로 이 부분은 필수는 아님)
            // rec.id = newDocRef.id;

        } else { // 기존 기록은 setDoc (업데이트) 사용
            const docRef = doc(db, 'users', uid, 'studyLogs', rec.id);
            await setDoc(docRef, {
                day: selectedDate, // 기록의 날짜 필드도 업데이트
                startTime: start,
                endTime: end,
                seconds: rec.seconds
            }, { merge: true });
        }
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
        endHour: currentHour,
        endMin: currentMin,
        endSec: currentSec,
        seconds: 0
    });

    renderRecords(); // UI 갱신
}

// 인증 상태 변경 감지
onAuthStateChanged(auth, async user => {
    if (!user) return location.href = '/BBUDDIstudy/index.html';
    // 날짜 선택기가 HTML에 로드되었는지 확인 후 초기 날짜 설정
    if (datePickerEl) {
        setInitialDate();
    } else {
        console.error("Element with ID 'record-date-picker' not found.");
    }
    await loadRecords(user.uid);
});

// 날짜 선택 변경 이벤트
datePickerEl?.addEventListener('change', async () => {
    const user = auth.currentUser;
    if (user) {
        await loadRecords(user.uid);
    }
});

// 기록 저장 버튼 클릭 이벤트
saveBtn?.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) return alert('로그인이 필요합니다.');
    await saveRecords(user.uid);
    alert('기록이 저장되었습니다!');
    // 저장 후 홈 페이지로 리다이렉트
    location.href = '/BBUDDIstudy/home.html';
});

// 기록 추가 버튼 클릭 이벤트
addRecordBtn?.addEventListener('click', addNewRecord);
