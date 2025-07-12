// todo-edit.js
import { auth } from '/BBUDDIstudy/js/firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const todoListEl = document.getElementById('todo-edit-list');
const addBtn = document.getElementById('add-todo-btn');
const deleteBtn = document.getElementById('delete-todo-btn');
const saveBtn = document.getElementById('save-todo-btn');

let deleteMode = false;

const db = getFirestore();

let todos = []; // {id?, text} 구조로 저장

// 로그인 확인
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = '/BBUDDIstudy/index.html';
    return;
  }
  await loadTodos(user.uid);
  renderTodos();
});

async function loadTodos(uid) {
  todos = [];
  const colRef = collection(db, 'users', uid, 'todos');
  const snapshot = await getDocs(colRef);
  snapshot.forEach(docSnap => {
    todos.push({ id: docSnap.id, text: docSnap.data().text });
  });
}

function renderTodos() {
  todoListEl.innerHTML = '';
  todos.forEach((todo, idx) => {
    const li = document.createElement('li');

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
      todos.splice(idx,1);
      renderTodos();
    });

    li.appendChild(input);
    li.appendChild(delBtn);
    todoListEl.appendChild(li);
  });
}

addBtn.addEventListener('click', () => {
  todos.push({ text: '' });
  renderTodos();
});

deleteBtn.addEventListener('click', () => {
  deleteMode = !deleteMode;
  renderTodos();
  deleteBtn.textContent = deleteMode ? '삭제 모드 종료' : '할 일 삭제';
});

saveBtn.addEventListener('click', async () => {
  // 입력 값 모두 todos 배열에 반영
  const inputs = todoListEl.querySelectorAll('input.todo-input');
  inputs.forEach((input, idx) => {
    todos[idx].text = input.value.trim();
  });

  const user = auth.currentUser;
  if (!user) return alert('로그인 상태가 아닙니다.');

  const colRef = collection(db, 'users', user.uid, 'todos');

  // 기존 할 일 모두 삭제 후 새로 저장 (간단 구현)
  const existingDocs = await getDocs(colRef);
  const batchDeletePromises = [];
  existingDocs.forEach(docSnap => {
    batchDeletePromises.push(deleteDoc(doc(db, 'users', user.uid, 'todos', docSnap.id)));
  });
  await Promise.all(batchDeletePromises);

  // 새 할 일 저장
  const batchAddPromises = todos
    .filter(todo => todo.text.length > 0)
    .map(todo => addDoc(colRef, { text: todo.text }));

  await Promise.all(batchAddPromises);

  alert('할 일이 저장되었습니다!');
  window.location.href = '/BBUDDIstudy/home.html';
});
