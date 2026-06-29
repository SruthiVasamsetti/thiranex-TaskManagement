// --- Configuration ---
const API_BASE_URL = 'http://localhost:5000/api';

// --- Shared Utility Functions ---
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Icon selection
  const icon = type === 'success' 
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

  toast.innerHTML = `${icon}<span>${message}</span>`;
  container.appendChild(toast);

  // Auto clean up toast
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// --- App Navigation Router Gate ---
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  
  // Check which page we are on by testing elements
  const isAuthPage = document.getElementById('auth-form') !== null;
  const isDashboardPage = document.getElementById('tasks-list-region') !== null;

  if (isAuthPage) {
    if (token) {
      // Re-route to dashboard already authenticated
      window.location.href = 'dashboard.html';
    } else {
      initAuthLogic();
    }
  } else if (isDashboardPage) {
    if (!token) {
      // Direct forbidden entry back to login screen
      window.location.href = 'index.html';
    } else {
      initDashboardLogic();
    }
  }
});

// --- Auth Page Module logic ---
function initAuthLogic() {
  const authForm = document.getElementById('auth-form');
  const authTitle = document.getElementById('auth-title');
  const authSubtitle = document.getElementById('auth-subtitle');
  const submitBtn = document.getElementById('auth-submit-btn');
  const toggleBtn = document.getElementById('auth-toggle-btn');
  const toggleContext = document.getElementById('auth-toggle-context');

  let isLoginMode = true;

  // Form Switcher Action
  const toggleAuthMode = () => {
    isLoginMode = !isLoginMode;
    toggleBtn.blur();
    
    if (isLoginMode) {
      authTitle.textContent = 'Welcome Back';
      authSubtitle.textContent = 'Unlock your productivity dashboard';
      submitBtn.textContent = 'Log In';
      toggleContext.innerHTML = `Don't have an account? <a id="auth-toggle-btn" role="button" tabindex="0">Sign Up</a>`;
    } else {
      authTitle.textContent = 'Create Account';
      authSubtitle.textContent = 'Start managing your tasks effectively today';
      submitBtn.textContent = 'Register';
      toggleContext.innerHTML = `Already have an account? <a id="auth-toggle-btn" role="button" tabindex="0">Log In</a>`;
    }
    
    // Re-attach event handle on new layout elements
    document.getElementById('auth-toggle-btn').addEventListener('click', toggleAuthMode);
  };

  // Switch connection toggle triggers
  toggleBtn.addEventListener('click', toggleAuthMode);

  // Form registration and logins API dispatch
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    const endpoint = isLoginMode ? '/auth/login' : '/auth/register';
    submitBtn.disabled = true;
    submitBtn.textContent = isLoginMode ? 'Verifying...' : 'Registering...';

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Store outputs
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      showToast(isLoginMode ? 'Logged in successfully!' : 'Registration successful!', 'success');
      
      // Navigate to dashboard
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 800);

    } catch (error) {
      showToast(error.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = isLoginMode ? 'Log In' : 'Register';
    }
  });
}

// --- Dashboard Module logic ---
function initDashboardLogic() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Set Profile Avatar and Username Marker
  const userDisplayName = document.getElementById('user-display-name');
  const userAvatar = document.getElementById('user-avatar');
  if (userDisplayName && user.username) {
    userDisplayName.textContent = user.username;
    userAvatar.textContent = user.username.charAt(0).toUpperCase();
  }

  // Logout Trigger setup
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showToast('Session logged out', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 500);
  });

  // Task Array States
  let tasks = [];
  let currentFilter = 'All';

  // Stats DOM nodes
  const totalValNode = document.getElementById('stat-total-val');
  const pendingValNode = document.getElementById('stat-pending-val');
  const completedValNode = document.getElementById('stat-completed-val');

  // --- Fetch Lists API Calls ---
  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.status === 401) {
        // Expired Sessions Auto Boot Out
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
        return;
      }

      if (!response.ok) {
        throw new Error('Could not fetch tasks');
      }

      const data = await response.json();
      tasks = data.tasks;
      updateStats();
      renderTasks();

    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  // --- Update Dashboard Stats Metrics ---
  const updateStats = () => {
    if (!totalValNode || !pendingValNode || !completedValNode) return;
    
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const pending = total - completed;

    totalValNode.textContent = total;
    pendingValNode.textContent = pending;
    completedValNode.textContent = completed;
  };

  // --- Render tasks dynamically ---
  const renderTasks = () => {
    const listRegion = document.getElementById('tasks-list-region');
    if (!listRegion) return;

    listRegion.innerHTML = '';

    // Filter application
    const filteredTasks = tasks.filter(t => {
      if (currentFilter === 'Completed') return t.status === 'Completed';
      if (currentFilter === 'Pending') return t.status === 'Pending';
      return true; // All
    });

    if (filteredTasks.length === 0) {
      listRegion.innerHTML = `
        <div class="tasks-empty card-glass">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3>No tasks found</h3>
          <p>${currentFilter === 'All' ? 'Click "Add Task" above to setup your first planner target.' : 'No tasks match this filter parameter.'}</p>
        </div>
      `;
      return;
    }

    filteredTasks.forEach(task => {
      const card = document.createElement('div');
      card.className = `task-card card-glass ${task.status === 'Completed' ? 'completed' : ''}`;
      card.dataset.id = task.id;

      // Due date alerts logic
      let dateBadge = '';
      if (task.due_date) {
        const formattedDate = new Date(task.due_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'UTC' // Keep date strings formatted without local shift
        });

        // Determine if due today, overdue, or future
        const today = new Date();
        today.setHours(0,0,0,0);
        const due = new Date(task.due_date);
        due.setHours(0,0,0,0);

        let dateClass = '';
        if (task.status === 'Pending') {
          if (due.getTime() < today.getTime()) {
            dateClass = 'overdue';
          } else if (due.getTime() === today.getTime()) {
            dateClass = 'due-today';
          }
        }

        dateBadge = `
          <div class="task-date ${dateClass}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>${formattedDate}${dateClass === 'overdue' ? ' (Overdue)' : dateClass === 'due-today' ? ' (Today)' : ''}</span>
          </div>
        `;
      }

      card.innerHTML = `
        <label class="task-checkbox-container" aria-label="Mark task state">
          <input type="checkbox" ${task.status === 'Completed' ? 'checked' : ''}>
          <span class="checkmark"></span>
        </label>
        
        <div class="task-main-content">
          <div class="task-title">${escapeHTML(task.title)}</div>
          ${task.description ? `<p class="task-desc">${escapeHTML(task.description)}</p>` : ''}
          <div class="task-meta">
            <span class="task-badge ${task.status === 'Completed' ? 'badge-completed' : 'badge-pending'}">${task.status}</span>
            ${dateBadge}
          </div>
        </div>

        <div class="task-actions">
          <button class="action-btn edit" title="Edit Task" aria-label="Edit task details">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </button>
          <button class="action-btn delete" title="Delete Task" aria-label="Remove Task">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <line x1="10" y1="11" x2="10" y2="17"/>
              <line x1="14" y1="11" x2="14" y2="17"/>
            </svg>
          </button>
        </div>
      `;

      // --- Attach Card Event Handlers ---

      // Checkbox state switch click handler
      const checkbox = card.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', async () => {
        const checkStatus = checkbox.checked ? 'Completed' : 'Pending';
        try {
          const response = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: checkStatus })
          });

          if (!response.ok) throw new Error('Status update failed');
          
          showToast(`Task marked as ${checkStatus}`, 'success');
          fetchTasks(); // reload lists

        } catch (e) {
          showToast(e.message, 'error');
          checkbox.checked = !checkbox.checked; // revert
        }
      });

      // Edit Button handler
      const editBtn = card.querySelector('.action-btn.edit');
      editBtn.addEventListener('click', () => {
        openModal(task);
      });

      // Delete Button handler
      const deleteBtn = card.querySelector('.action-btn.delete');
      deleteBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to delete this task?')) return;
        try {
          const response = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (!response.ok) throw new Error('Task deletion failed');
          
          showToast('Task removed', 'success');
          fetchTasks(); // refresh

        } catch (e) {
          showToast(e.message, 'error');
        }
      });

      listRegion.appendChild(card);
    });
  };

  // --- Modal Overlay Controls ---
  const taskModalOverlay = document.getElementById('task-modal-overlay');
  const taskForm = document.getElementById('task-form');
  const modalTitleText = document.getElementById('modal-title-text');
  const saveTaskBtn = document.getElementById('save-task-btn');
  
  const openModal = (editingTask = null) => {
    // Reset forms
    taskForm.reset();
    document.getElementById('edit-task-target-id').value = '';
    
    if (editingTask) {
      modalTitleText.textContent = 'Edit Task';
      saveTaskBtn.textContent = 'Save Changes';
      document.getElementById('edit-task-target-id').value = editingTask.id;
      document.getElementById('task-title').value = editingTask.title;
      document.getElementById('task-desc').value = editingTask.description || '';
      
      if (editingTask.due_date) {
        // Extract yyyy-mm-dd from TIMESTAMP
        const datePart = editingTask.due_date.split('T')[0];
        document.getElementById('task-duedate').value = datePart;
      }
    } else {
      modalTitleText.textContent = 'Create New Task';
      saveTaskBtn.textContent = 'Create Task';
    }

    taskModalOverlay.classList.add('active');
  };

  const closeModal = () => {
    taskModalOverlay.classList.remove('active');
    taskForm.reset();
  };

  // Bind Open/Close Actions
  document.getElementById('open-create-modal-btn').addEventListener('click', () => openModal());
  document.getElementById('close-modal-btn').addEventListener('click', closeModal);
  document.getElementById('cancel-task-btn').addEventListener('click', closeModal);

  // Close modal when clicking on layout background overlay
  taskModalOverlay.addEventListener('click', (e) => {
    if (e.target === taskModalOverlay) closeModal();
  });

  // Modal form submit handle (Create/Edit request routing)
  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-desc').value.trim();
    const due_date = document.getElementById('task-duedate').value;
    const editingTaskId = document.getElementById('edit-task-target-id').value;

    const payload = { title, description, due_date };
    let method = 'POST';
    let url = `${API_BASE_URL}/tasks`;

    if (editingTaskId) {
      method = 'PUT';
      url = `${API_BASE_URL}/tasks/${editingTaskId}`;
    }

    saveTaskBtn.disabled = true;
    saveTaskBtn.textContent = 'Saving...';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Saving task failed');
      }

      showToast(editingTaskId ? 'Task updated!' : 'Task created successfully!', 'success');
      closeModal();
      fetchTasks(); // reload dashboard stats and lists

    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      saveTaskBtn.disabled = false;
      saveTaskBtn.textContent = editingTaskId ? 'Save Changes' : 'Create Task';
    }
  });

  // --- Filter Events binding ---
  const filterBtns = {
    'All': document.getElementById('filter-all'),
    'Pending': document.getElementById('filter-pending'),
    'Completed': document.getElementById('filter-completed')
  };

  Object.keys(filterBtns).forEach(filterName => {
    const btn = filterBtns[filterName];
    if (!btn) return;
    
    btn.addEventListener('click', () => {
      // De-activate current active btn
      Object.values(filterBtns).forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      // Activate clicked one
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      currentFilter = filterName;
      renderTasks();
    });
  });

  // Initial dashboard load
  fetchTasks();
}

// Escape HTML utility to avoid XSS injections in text renderers
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
