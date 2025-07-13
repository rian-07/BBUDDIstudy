// home.js
import { auth } from '/BBUDDIstudy/js/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
// query와 where를 추가로 import 합니다.
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();

// 버튼 요소 가져오기
const startStudyBtn = document.getElementById('start-study-btn');
const editRecordBtn = document.getElementById('edit-record-btn');
const editTodoBtn = document.getElementById('edit-todo-btn');
const studyTimeEl = document.getElementById('study-time'); // 총 공부 시간을 표시할 요소
const todoListEl = document.getElementById('todo-list');

// ✅ 버튼 클릭 이벤트 (변경 없음)
startStudyBtn?.addEventListener('click', () => {
    window.location.href = '/BBUDDIstudy/study.html';
});

editRecordBtn?.addEventListener('click', () => {
    window.location.href = '/BBUDDIstudy/edit-record.html';
});

editTodoBtn?.addEventListener('click', () => {
    window.location.href = '/BBUDDIstudy/todo-edit.html';
});

// ✅ 로그인 상태 확인 및 정보 불러오기
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = '/BBUDDIstudy/index.html';
        return;
    }

    // 🔹 오늘 공부 시간 모두 합산하여 불러오기
    const todayKey = getTodayKey(); // YYYY-MM-DD 형식의 오늘 날짜
    let totalSecondsToday = 0; // 오늘 총 공부 시간 합산을 위한 변수

    try {
        const studyLogsRef = collection(db, 'users', user.uid, 'studyLogs');
        // 'day' 필드가 오늘 날짜와 일치하는 모든 문서를 쿼리합니다.
        const q = query(studyLogsRef, where('day', '==', todayKey));
        const querySnapshot = await getDocs(q);

        // 쿼리 결과를 순회하며 각 문서의 'seconds' 값을 합산합니다.
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            // data.seconds가 존재하고 유효한 숫자인지 확인 후 합산합니다.
            if (typeof data.seconds === 'number' && !isNaN(data.seconds)) {
                totalSecondsToday += data.seconds;
            }
        });

        // 합산된 총 공부 시간을 UI에 표시합니다.
        if (studyTimeEl) { // studyTimeEl이 존재하는지 확인
            studyTimeEl.textContent = formatSeconds(totalSecondsToday);
        } else {
            console.error("Element with ID 'study-time' not found.");
        }

    } catch (error) {
        console.error("오늘 공부 시간 합산 불러오기 오류:", error);
        if (studyTimeEl) {
            studyTimeEl.textContent = "시간 로드 오류";
        }
    }

    // 🔹 오늘 할 일 목록 불러오기 (변경 없음)
    const todoColRef = collection(db, 'users', user.uid, 'todos');
    const todoSnap = await getDocs(todoColRef);

    if (todoListEl) { // todoListEl이 존재하는지 확인
        todoListEl.innerHTML = ''; // 기존 목록 초기화
        if (todoSnap.empty) {
            const emptyMsg = document.createElement('li');
            emptyMsg.textContent = '오늘 할 일이 없습니다.';
            emptyMsg.style.color = '#effdeb';
            todoListEl.appendChild(emptyMsg);
        } else {
            todoSnap.forEach(doc => {
                const li = document.createElement('li');
                li.textContent = doc.data().text;
                todoListEl.appendChild(li);
            });
        }
    } else {
        console.error("Element with ID 'todo-list' not found.");
    }
});

// ✅ 새벽 5시 기준 날짜 반환 (변경 없음)
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

// ✅ 초 단위를 HH:MM:SS로 변환 (변경 없음)
function formatSeconds(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}
