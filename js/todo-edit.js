import { auth } from '/BBUDDIstudy/js/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();

const todoListEl = document.getElementById('todo-edit-list');
const addBtn = document.getElementById('add-todo-btn');
const deleteBtn = document.getElementById('delete-todo-btn');
const saveBtn = document.getElementById('save-todo-btn');

let deleteMode = false;
let todos = []; // { id?, text }

// 사용자 로그인 확인 및 데이터 불러오기
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = '/BBUDDIstudy/index.html';
    return;
  }
  await loadTodos(user.uid);
  renderTodos();
});

// Firestore에서 할 일 목록 불러오기
async function loadTodos(uid) {
  todos = [];
  const colRef = collection(db, 'users', uid, 'todos');
  const snapshot = await getDocs(colRef);

  snapshot.forEach(docSnap => {
    todos.push({ id: docSnap.id, text: docSnap.data().text });
  });
}

// 할 일 목록 화면에 렌더링
function renderTodos() {
  todoListEl.innerHTML = '';

  todos.forEach((todo, idx) => {
    const li = document.createElement('li');
    li.className = 'todo-item';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'todo-input';
    input.value = todo.text;
    input.dataset.idx = idx;

    const delBtn = document.createElement('button');
    delBtn.textContent = '×';
    delBtn.className = 'todo-delete-btn';
    delBtn.style.display = deleteMode ? 'inline-block' : 'none';
    delBtn.dataset.idx = idx;

    delBtn.addEventListener('click', () => {
      todos.splice(idx, 1);
      renderTodos();
    });

    li.appendChild(input);
    li.appendChild(delBtn);
    todoListEl.appendChild(li);
  });
}

// 할 일 추가 버튼
addBtn.addEventListener('click', () => {
  const inputs = todoListEl.querySelectorAll('input.todo-input');
  inputs.forEach((input, idx) => {
    todos[idx].text = input.value;
  });

  todos.push({ text: '' });
  renderTodos();
});

// 삭제 모드 토글
deleteBtn.addEventListener('click', () => {
  deleteMode = !deleteMode;
  deleteBtn.textContent = deleteMode ? '삭제 모드 종료' : '할 일 삭제';
  renderTodos();
});

// 저장 버튼 클릭 시
saveBtn.addEventListener('click', async () => {
  const inputs = todoListEl.querySelectorAll('input.todo-input');
  inputs.forEach((input, idx) => {
    todos[idx].text = input.value.trim();
  });

  const user = auth.currentUser;
  if (!user) return alert('로그인 상태가 아닙니다.');

  const colRef = collection(db, 'users', user.uid, 'todos');

  // 기존 할 일 삭제
  const oldTodos = await getDocs(colRef);
  const deletePromises = [];
  oldTodos.forEach(docSnap => {
    deletePromises.push(deleteDoc(doc(db, 'users', user.uid, 'todos', docSnap.id)));
  });
  await Promise.all(deletePromises);

  // 새 할 일 저장
  const addPromises = todos
    .filter(todo => todo.text.length > 0)
    .map(todo => addDoc(colRef, { text: todo.text }));
  await Promise.all(addPromises);

  alert('할 일이 저장되었습니다!');
  window.location.href = '/BBUDDIstudy/home.html';
});
