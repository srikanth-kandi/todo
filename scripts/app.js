const taskInput = document.getElementById("task-input");
const priorityInput = document.getElementById("task-priority");
const dateInput = document.getElementById("task-deadline");
const addButton = document.getElementById("add-task");
const taskList = document.getElementById("task-list");
const toggleThemeButton = document.getElementById("toggle-theme");
const statusFilter = document.getElementById("status-filter");
const priorityFilter = document.getElementById("priority-filter");
const formActions = document.getElementById("form-actions");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let editTaskId = null; // Track if editing
let cancelButton = null;

function validateForm() {
  let isValid = true;
  const taskTitle = taskInput.value.trim();
  const deadline = dateInput.value;

  // Reset previous error states
  document.getElementById("task-input-error").textContent = "";
  document.getElementById("task-deadline-error").textContent = "";
  taskInput.classList.remove("input-error");
  dateInput.classList.remove("input-error");

  // Validate task title
  if (taskTitle === "") {
    document.getElementById("task-input-error").textContent =
      "Please enter a task title";
    taskInput.classList.add("input-error");
    isValid = false;
  }

  // Validate deadline
  if (deadline === "") {
    document.getElementById("task-deadline-error").textContent =
      "Please select a deadline";
    dateInput.classList.add("input-error");
    isValid = false;
  }

  return isValid;
}

function addTask() {
  if (!validateForm()) return;

  const taskTitle = taskInput.value.trim();
  const priority = priorityInput.value;
  const deadline = dateInput.value;

  if (editTaskId !== null) {
    // Edit mode
    tasks = tasks.map((task) =>
      task.id === editTaskId
        ? { ...task, title: taskTitle, priority, deadline }
        : task
    );
    showNotification("Task updated successfully!");
    editTaskId = null;
    updateAddButton("add");
  } else {
    // Add mode
    const task = {
      id: Date.now(),
      title: taskTitle,
      priority: priority,
      deadline: deadline,
      completed: false,
    };
    tasks.push(task);
    showNotification("Task added successfully!");
  }

  saveTasks();
  displayTasks();
  clearInputs();
}

function showNotification(message, isError = false) {
  // Check if notification container exists, if not create it
  let notificationContainer = document.getElementById("notification-container");

  if (!notificationContainer) {
    notificationContainer = document.createElement("div");
    notificationContainer.id = "notification-container";
    notificationContainer.style.position = "fixed";
    notificationContainer.style.top = "20px";
    notificationContainer.style.right = "20px";
    notificationContainer.style.zIndex = "1000";
    document.body.appendChild(notificationContainer);
  }

  const notification = document.createElement("div");
  notification.className = `notification ${isError ? "error" : "success"}`;
  notification.style.backgroundColor = isError ? "#f44336" : "#4caf50";
  notification.style.color = "white";
  notification.style.padding = "12px 20px";
  notification.style.marginBottom = "10px";
  notification.style.borderRadius = "4px";
  notification.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)";
  notification.style.transition = "all 0.3s ease";
  notification.style.opacity = "0";

  notification.textContent = message;

  notificationContainer.appendChild(notification);

  // Fade in
  setTimeout(() => {
    notification.style.opacity = "1";
  }, 10);

  // Fade out and remove
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Add input validation listeners
taskInput.addEventListener("input", function () {
  if (this.value.trim() !== "") {
    document.getElementById("task-input-error").textContent = "";
    this.classList.remove("input-error");
  }
});

dateInput.addEventListener("change", function () {
  if (this.value !== "") {
    document.getElementById("task-deadline-error").textContent = "";
    this.classList.remove("input-error");
  }
});

// Add CSS for notifications
const style = document.createElement("style");
style.textContent = `
  .notification {
    animation: slideInRight 0.3s forwards;
  }
  
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }
`;
document.head.appendChild(style);

function displayTasks() {
  const statusValue = statusFilter ? statusFilter.value : "all";
  const priorityValue = priorityFilter ? priorityFilter.value : "all";

  taskList.innerHTML = "";

  const filteredTasks = tasks.filter((task) => {
    const statusMatch =
      statusValue === "all"
        ? true
        : statusValue === "completed"
        ? task.completed
        : !task.completed;

    const priorityMatch =
      priorityValue === "all" ? true : task.priority === priorityValue;

    return statusMatch && priorityMatch;
  });

  if (filteredTasks.length === 0) {
    taskList.innerHTML = `<div class="empty-state card">
      <p>No tasks found. Add a new task to get started!</p>
    </div>`;
    return;
  }

  filteredTasks.forEach((task) => {
    const isOverdueTask = isOverdue(task.deadline);
    const formattedDate = formatDate(task.deadline);

    const taskItem = document.createElement("div");
    taskItem.className = `task-item card ${task.completed ? "completed" : ""}`;

    taskItem.innerHTML = `
      <div class="task-content">
        <div class="task-row main-row">
          <input type="checkbox" class="task-checkbox" ${
            task.completed ? "checked" : ""
          } onchange="markAsCompleted(${task.id})">
          <div class="task-title">${task.title}</div>
          <div class="task-actions">
            <button class="action-btn edit" onclick="editTask(${
              task.id
            })" title="Edit">
              <i class="fas fa-pen"></i>
            </button>
            <button class="action-btn delete" onclick="deleteTask(${
              task.id
            })" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="task-row meta-row">
          <span class="task-priority priority-${
            task.priority
          }">${capitalizeFirst(task.priority)}</span>
          <span class="task-date">
            <i class="far fa-calendar-alt"></i>
            ${formattedDate}
          </span>
          ${
            isOverdueTask
              ? `<span class="overdue-badge"><i class="far fa-clock"></i> Overdue</span>`
              : ""
          }
        </div>
      </div>
    `;
    taskList.appendChild(taskItem);
  });
}

function formatDate(dateString) {
  if (!dateString) return "No date";

  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  // Check if it's today or tomorrow
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  // Calculate if date is within 30 days
  const diffTime = date - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 0 && diffDays <= 30) {
    return `Due in ${diffDays} days`;
  }

  // Otherwise return formatted date
  return date.toLocaleDateString();
}

function capitalizeFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function markAsCompleted(taskId) {
  tasks = tasks.map((task) => {
    if (task.id === taskId) {
      task.completed = !task.completed;
    }
    return task;
  });
  saveTasks();
  displayTasks();
}

function editTask(taskId) {
  const task = tasks.find((task) => task.id === taskId);
  if (task) {
    taskInput.value = task.title;
    priorityInput.value = task.priority;
    dateInput.value = task.deadline;
    editTaskId = taskId;
    updateAddButton("edit");
  }
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  displayTasks();
}

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function clearInputs() {
  taskInput.value = "";
  priorityInput.value = "medium";
  dateInput.value = "";
  editTaskId = null;
  updateAddButton("add");
}

function updateAddButton(mode) {
  if (mode === "edit") {
    addButton.innerHTML = `<i class="fas fa-pen"></i> Edit Task`;
    // Add Cancel button if not present
    if (!cancelButton) {
      cancelButton = document.createElement("button");
      cancelButton.type = "button";
      cancelButton.className = "btn cancel";
      cancelButton.innerHTML = `<i class="fas fa-times"></i> Cancel`;
      cancelButton.onclick = clearInputs;
      formActions.appendChild(cancelButton);
    }
  } else {
    addButton.innerHTML = `<i class="fas fa-plus"></i> Add Task`;
    // Remove Cancel button if present
    if (cancelButton && formActions.contains(cancelButton)) {
      formActions.removeChild(cancelButton);
      cancelButton = null;
    }
  }
}

function isOverdue(deadline) {
  if (!deadline) return false;
  return (
    new Date(deadline) < new Date() &&
    !tasks.find((task) => task.deadline === deadline && task.completed)
  );
}

function toggleTheme() {
  document.body.classList.toggle("dark-theme");
  const icon = toggleThemeButton.querySelector("i");
  if (document.body.classList.contains("dark-theme")) {
    icon.classList.replace("fa-moon", "fa-sun");
    localStorage.setItem("theme", "dark");
  } else {
    icon.classList.replace("fa-sun", "fa-moon");
    localStorage.setItem("theme", "light");
  }
}

// Apply saved theme on load
function applyTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
    toggleThemeButton.querySelector("i").classList.replace("fa-moon", "fa-sun");
  }
}

// Add this function to set today's date as default
function setDefaultDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  dateInput.value = `${year}-${month}-${day}`;
}

// Event listeners
addButton.addEventListener("click", addTask);
toggleThemeButton.addEventListener("click", toggleTheme);

if (statusFilter) statusFilter.addEventListener("change", displayTasks);
if (priorityFilter) priorityFilter.addEventListener("change", displayTasks);

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  loadTasks();
  setDefaultDate && setDefaultDate();
  updateAddButton("add");
});

function loadTasks() {
  displayTasks();
}
