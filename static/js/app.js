// app.js — Authentication, Toast Notifications, Dynamic Nav

// ── Toast System ──
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  const icons = {
    success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
    error:   '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    info:    '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
  };

  toast.innerHTML = (icons[type] || icons.info) + `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast--exit');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── Auth Helpers ──
function isLoggedIn() {
  return !!localStorage.getItem('token');
}

function getPageName() {
  return window.location.pathname.split('/').pop() || 'index.html';
}

// ── Dynamic Navigation ──
function updateNavbar() {
  const navUl = document.querySelector('.navbar ul');
  if (!navUl) return;

  const loggedIn = isLoggedIn();
  const page = getPageName();

  if (loggedIn) {
    // Logged in: Home, About, Dashboard, Logout
    navUl.innerHTML = `
      <li><a href="./home.html"${page === 'home.html' ? ' class="nav-active"' : ''}>Home</a></li>
      <li><a href="./about.html"${page === 'about.html' ? ' class="nav-active"' : ''}>About</a></li>
      <li><a href="./work_page.html"${page === 'work_page.html' ? ' class="nav-active"' : ''}>Dashboard</a></li>
      <li><a href="#" id="logout-btn">Logout</a></li>
    `;
    // Re-attach logout handler
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.onclick = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (token) {
          try { await fetch('/api/disconnect', { headers: { 'x-token': token } }); } catch (_) {}
        }
        localStorage.removeItem('token');
        showToast("Logged out successfully.", "info");
        setTimeout(() => window.location.href = './login.html', 800);
      };
    }
  } else {
    // Not logged in: Home, About, Log In, Sign Up
    navUl.innerHTML = `
      <li><a href="./home.html"${page === 'home.html' ? ' class="nav-active"' : ''}>Home</a></li>
      <li><a href="./about.html"${page === 'about.html' ? ' class="nav-active"' : ''}>About</a></li>
      <li><a href="./login.html"${page === 'login.html' ? ' class="nav-active"' : ''}>Log In</a></li>
      <li><a href="./index.html" class="nav-cta">Sign Up</a></li>
    `;
  }
}

// ── Page Protection ──
function protectDashboard() {
  const page = getPageName();
  if (page === 'work_page.html' && !isLoggedIn()) {
    window.location.href = './login.html';
    return true; // blocked
  }
  return false;
}

// ── Init ──
document.addEventListener("DOMContentLoaded", () => {

  // Protect dashboard FIRST — redirect immediately if not logged in
  if (protectDashboard()) return;

  // Update navbar based on auth state
  updateNavbar();

  // ── Signup Handler ──
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirm-password").value;

      if (password !== confirmPassword) {
        showToast("Passwords do not match!", "error");
        return;
      }
      if (password.length < 6) {
        showToast("Password must be at least 6 characters.", "error");
        return;
      }

      const btn = signupForm.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;margin:0;"></div>';

      try {
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        });
        const data = await response.json();
        if (response.ok) {
          showToast("Account created! Redirecting to login...", "success");
          setTimeout(() => window.location.href = './login.html', 1500);
        } else {
          showToast(data.error || "Signup failed", "error");
        }
      } catch (error) {
        console.error("Signup error:", error);
        showToast("An error occurred during signup.", "error");
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  }

  // ── Login Handler ──
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const credentials = btoa(`${email}:${password}`);

      const btn = loginForm.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px;margin:0;"></div>';

      try {
        const response = await fetch('/api/connect', {
          method: 'GET',
          headers: { 'Authorization': `Basic ${credentials}` }
        });
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('token', data.token);
          showToast("Login successful! Redirecting...", "success");
          setTimeout(() => window.location.href = './work_page.html', 1000);
        } else {
          showToast(data.error || "Login failed", "error");
        }
      } catch (error) {
        console.error("Login error:", error);
        showToast("An error occurred during login.", "error");
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  }
});
