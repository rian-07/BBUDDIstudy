// Firebase import 및 설정 부분 (appId는 나중에 넣어도 됨)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAhdJZcG-4p4D2dT5K5QaPo5OLzShS2krw",
  authDomain: "bbuddistudy.firebaseapp.com",
  projectId: "bbuddistudy",
  storageBucket: "bbuddistudy.appspot.com",
  messagingSenderId: "154303839611",
  appId: "your-app-id-here"  // 나중에 정확한 앱ID로 교체
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 로그인 관련 함수
export function signUp() {
  const email = document.getElementById("email").value;
  const pw = document.getElementById("password").value;
  createUserWithEmailAndPassword(auth, email, pw)
    .then(() => alert("회원가입 성공"))
    .catch(e => alert("오류: " + e.message));
}

export function signIn() {
  const email = document.getElementById("email").value;
  const pw = document.getElementById("password").value;
  signInWithEmailAndPassword(auth, email, pw)
    .then(() => alert("로그인 성공"))
    .catch(e => alert("오류: " + e.message));
}

export function signOut() {
  firebaseSignOut(auth)
    .then(() => alert("로그아웃 성공"))
    .catch(e => alert("오류: " + e.message));
}

onAuthStateChanged(auth, user => {
  const info = document.getElementById("userInfo");
  if (user) {
    info.textContent = `로그인 상태: ${user.email}`;
  } else {
    info.textContent = "로그인 상태: 없음";
  }
});

// === 새벽 5시 기준 날짜 계산 함수
function getTodayKey() {
  const now = new Date();
  if (now.getHours() < 5) now.setDate(now.getDate() - 1);
  return now.toISOString().slice(0, 10);
}

// === 목표 타이머 관련 함수
function updateGoalProgress() {
  const key = "focus_total_" + getTodayKey();
  const totalSec = parseInt(localStorage.getItem(key)) || 0;
  const goalMin = parseInt(document.getElementById("goalMinutes").value) || 180;
  const percent = Math.min(100, Math.floor((totalSec / 60) / goalMin * 100));
  document.getElementById("totalDisplay").textContent = Math.floor(totalSec / 60) + "분";
  document.getElementById("goalPercent").textContent = percent + "%";
}

function addToTotal(seconds) {
  const key = "focus_total_" + getTodayKey();
  const prev = parseInt(localStorage.getItem(key)) || 0;
  localStorage.setItem(key, prev + seconds);
  updateGoalProgress();
}

export function setManualTotal() {
  const mins = parseInt(document.getElementById("manualTotal").value);
  if (isNaN(mins) || mins < 0) return alert("올바른 값을 입력하세요!");
  const key = "focus_total_" + getTodayKey();
  localStorage.setItem(key, mins * 60);
  updateGoalProgress();
  document.getElementById("manualTotal").value = '';
}

// === 포모도로 타이머
let pomoInterval, pomoSec = 0, isPomoRunning = false;

export function startPomodoro() {
  if (isPomoRunning) return;
  const focusMin = parseInt(document.getElementById("focusMinutes").value) || 25;
  pomoSec = focusMin * 60;
  isPomoRunning = true;
  pomoInterval = setInterval(() => {
    if (pomoSec <= 0) {
      clearInterval(pomoInterval);
      isPomoRunning = false;
      alert("⏰ 집중 시간 끝! 휴식하세요!");
      addToTotal(focusMin * 60);
      return;
    }
    pomoSec--;
    displayTime("pomodoroTimer", pomoSec);
  }, 1000);
}

export function pausePomodoro() {
  clearInterval(pomoInterval);
  isPomoRunning = false;
}

export function resetPomodoro() {
  pausePomodoro();
  const focusMin = parseInt(document.getElementById("focusMinutes").value) || 25;
  pomoSec = focusMin * 60;
  displayTime("pomodoroTimer", pomoSec);
}

// === 일반 타이머
let basicInterval, basicSec = 0, isBasicRunning = false;

export function startBasic() {
  if (isBasicRunning) return;
  isBasicRunning = true;
  basicInterval = setInterval(() => {
    basicSec++;
    displayTime("basicTimer", basicSec);
  }, 1000);
}

export function pauseBasic() {
  clearInterval(basicInterval);
  isBasicRunning = false;
}

export function resetBasic() {
  pauseBasic();
  basicSec = 0;
  displayTime("basicTimer", basicSec);
}

export function saveBasic() {
  addToTotal(basicSec);
  alert(`✅ ${Math.floor(basicSec / 60)}분 저장됨`);
  resetBasic();
}

// === 시간 표시 함수
function displayTime(id, totalSec) {
  const min = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const sec = String(totalSec % 60).padStart(2, '0');
  document.getElementById(id).textContent = `${min}:${sec}`;
}

// === D-Day 기능
export function addDday() {
  const title = document.getElementById("ddayTitle").value;
  const dateStr = document.getElementById("ddayDate").value;
  if (!title || !dateStr) return alert("제목과 날짜를 입력하세요!");
  const today = new Date();
  const target = new Date(dateStr);
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  const text = diff >= 0 ? `${title}까지 D-${diff}` : `${title}로부터 +${-diff}일`;
  const li = document.createElement("li");
  li.textContent = text;
  const delBtn = document.createElement("button");
  delBtn.textContent = "❌";
  delBtn.onclick = () => li.remove();
  li.appendChild(delBtn);
  document.getElementById("ddayList").appendChild(li);
}

// === 탭 전환 함수
export function openTab(tabId) {
  document.querySelectorAll(".tab-content").forEach(el => el.style.display = "none");
  document.getElementById(tabId).style.display = "block";
}

// === 초기화
window.onload = () => {
  resetPomodoro();
  resetBasic();
  updateGoalProgress();
  openTab("pomodoroTab");
};
