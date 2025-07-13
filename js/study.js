import { auth } from '/BBUDDIstudy/js/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
// addDoc을 import 해야 합니다. setDoc 대신 addDoc을 사용합니다.
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();

let studyStartTime = null; // 공부 시작 시간 (Date.now() 값)
let studyInterval = null;  // 타이머 인터벌 ID

// 현재 공부 시간 (초 단위) 계산
function getElapsedSeconds() {
    // studyStartTime이 설정되지 않았다면 0 반환
    if (studyStartTime === null) return 0;
    return Math.floor((Date.now() - studyStartTime) / 1000);
}

// 초를 HH:MM:SS 형식으로 포맷
function formatTime(seconds) {
    const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

// 공부 타이머 시작
function startStudyTimer() {
    // 이미 타이머가 실행 중이면 중복 실행 방지
    if (studyInterval) return;

    studyStartTime = Date.now(); // 공부 시작 시각 기록

    // 1초마다 타이머 업데이트
    studyInterval = setInterval(() => {
        const elapsed = getElapsedSeconds();
        const currentStudyTimeEl = document.getElementById('current-study-time');
        if (currentStudyTimeEl) {
            currentStudyTimeEl.textContent = formatTime(elapsed);
        }
    }, 1000);
}

// 공부 타이머 중지
function stopStudyTimer() {
    if (studyInterval) {
        clearInterval(studyInterval);
        studyInterval = null;
    }
}

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환 (새벽 5시 기준)
function getTodayFormattedDate() {
    const now = new Date();
    // 00:00부터 04:59까지는 전날로 간주하여 날짜를 계산
    if (now.getHours() < 5) {
        now.setDate(now.getDate() - 1);
    }
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Firestore에 공부 기록 저장 (각 세션을 새로운 문서로 저장)
async function saveStudyLog(uid, seconds) {
    const dayString = getTodayFormattedDate(); // 현재 세션의 날짜 (YYYY-MM-DD)

    const startDate = new Date(studyStartTime);
    const startTimeStr = startDate.toTimeString().slice(0, 8); // 시작 시간 (HH:MM:SS)
    const endTimeStr = new Date().toTimeString().slice(0, 8);   // 종료 시간 (HH:MM:SS)

    const collectionRef = collection(db, 'users', uid, 'studyLogs');
    
    try {
        // addDoc을 사용하여 Firebase가 자동으로 고유한 문서 ID를 생성하도록 합니다.
        await addDoc(collectionRef, {
            day: dayString,    // 이 필드를 추가하여 특정 날짜의 기록을 쉽게 찾을 수 있도록 합니다.
            startTime: startTimeStr,
            endTime: endTimeStr,
            seconds: seconds
        });
        console.log("공부 기록이 성공적으로 추가되었습니다.");
    } catch (error) {
        console.error("공부 기록 저장 중 오류 발생:", error);
        alert("기록 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
}

// Firebase 인증 상태 변경 감지
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
        window.location.href = "/BBUDDIstudy/index.html";
        return;
    }

    // 사용자가 로그인되면 공부 타이머 시작
    startStudyTimer();

    // '공부 끝내기' 버튼 이벤트 리스너
    const endBtn = document.getElementById("end-study-btn");
    if (endBtn) { // 버튼이 존재하는지 확인
        endBtn.addEventListener("click", async () => {
            const seconds = getElapsedSeconds(); // 현재까지 공부한 총 시간
            stopStudyTimer(); // 타이머 중지
            
            // seconds가 유효한 값 (0 이상)일 때만 저장
            if (seconds > 0) {
                await saveStudyLog(user.uid, seconds);
                alert("공부 기록이 저장되었습니다!");
            } else {
                alert("공부 시간이 0초이므로 저장되지 않았습니다.");
            }
            window.location.href = "/BBUDDIstudy/home.html"; // 홈 화면으로 이동
        });
    } else {
        console.error("Element with ID 'end-study-btn' not found.");
    }

    // --- 뽀모도로 타이머 관련 코드 (변경 없음) ---
    let pomoTime = 25 * 60; // 기본 25분 (초 단위)
    let pomoInterval = null;

    const pomoEl = document.getElementById("pomodoro-timer");
    const startBtn = document.getElementById("start-pomo-btn");
    const pauseBtn = document.getElementById("pause-pomo-btn");
    const resetBtn = document.getElementById("reset-pomo-btn");

    function updatePomoDisplay() {
        if (pomoEl) {
            const m = String(Math.floor(pomoTime / 60)).padStart(2, '0');
            const s = String(pomoTime % 60).padStart(2, '0');
            pomoEl.textContent = `${m}:${s}`;
        }
    }

    if (startBtn) {
        startBtn.addEventListener("click", () => {
            if (!pomoInterval) {
                pomoInterval = setInterval(() => {
                    pomoTime--;
                    if (pomoTime <= 0) {
                        clearInterval(pomoInterval);
                        pomoInterval = null;
                        alert("뽀모도로 타이머 종료!");
                        pomoTime = 0; // 0으로 확실히 설정
                    }
                    updatePomoDisplay();
                }, 1000);
            }
        });
    } else {
        console.error("Element with ID 'start-pomo-btn' not found.");
    }

    if (pauseBtn) {
        pauseBtn.addEventListener("click", () => {
            clearInterval(pomoInterval);
            pomoInterval = null;
        });
    } else {
        console.error("Element with ID 'pause-pomo-btn' not found.");
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            clearInterval(pomoInterval);
            pomoInterval = null;
            pomoTime = 25 * 60; // 25분으로 초기화
            updatePomoDisplay();
        });
    } else {
        console.error("Element with ID 'reset-pomo-btn' not found.");
    }

    updatePomoDisplay(); // 초기 뽀모도로 타이머 표시
});
