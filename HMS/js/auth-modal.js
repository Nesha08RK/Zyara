// auth-modal.js - Handles login and registration modals

// Create and append the auth modal to the body
function createAuthModal() {
  const modalHTML = `
    <div id="authModal" class="modal">
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="authModalTitle">Login</h2>
          <button class="modal-close" onclick="closeAuthModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <!-- Login Form -->
          <form id="loginForm" class="auth-form">
            <div class="form-group">
              <label for="login-email">Email Address</label>
              <input type="email" id="login-email" required>
            </div>
            <div class="form-group">
              <label for="login-password">Password</label>
              <input type="password" id="login-password" required>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-primary">Login</button>
            </div>
            <p class="form-switch">Don't have an account? <a href="#" onclick="showRegistrationForm()">Register</a></p>
          </form>
          
          <!-- Registration Form -->
          <form id="registerForm" class="auth-form" style="display: none;">
            <div class="form-group">
              <label for="register-name">Full Name</label>
              <input type="text" id="register-name" required>
            </div>
            <div class="form-group">
              <label for="register-email">Email Address</label>
              <input type="email" id="register-email" required>
            </div>
            <div class="form-group">
              <label for="register-password">Password</label>
              <input type="password" id="register-password" required>
            </div>
            <div class="form-group">
              <label for="register-confirm-password">Confirm Password</label>
              <input type="password" id="register-confirm-password" required>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-primary">Register</button>
            </div>
            <p class="form-switch">Already have an account? <a href="#" onclick="showLoginForm()">Login</a></p>
          </form>
        </div>
      </div>
    </div>
  `;
  
  // Create a div element to hold the modal
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;
  
  // Append the modal to the body
  document.body.appendChild(modalContainer.firstElementChild);
  
  // Add event listeners
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegistration);
}

// Show the auth modal with login form
function openAuthModal() {
  // Create the modal if it doesn't exist
  if (!document.getElementById('authModal')) {
    createAuthModal();
  }
  
  // Show the modal
  const modal = document.getElementById('authModal');
  modal.style.display = 'flex';
  
  // Show login form by default
  showLoginForm();
}

// Close the auth modal
function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Show the login form
function showLoginForm() {
  document.getElementById('authModalTitle').textContent = 'Login';
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
}

// Show the registration form
function showRegistrationForm() {
  document.getElementById('authModalTitle').textContent = 'Register';
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
}

// Handle login form submission
async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  try {
    const result = await window.authAPI.loginUser({ email, password });
    
    // Show success message
    alert('Login successful!');
    
    // Close the modal
    closeAuthModal();
    
    // Refresh the page or update UI
    updateAuthUI();
  } catch (error) {
    alert(`Login failed: ${error.message}`);
  }
}

// Handle registration form submission
async function handleRegistration(event) {
  event.preventDefault();
  
  const name = document.getElementById('register-name').value;
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;
  
  // Check if passwords match
  if (password !== confirmPassword) {
    alert('Passwords do not match!');
    return;
  }
  
  try {
    const result = await window.authAPI.registerUser({ name, email, password });
    
    // Show success message
    alert('Registration successful!');
    
    // Close the modal
    closeAuthModal();
    
    // Refresh the page or update UI
    updateAuthUI();
  } catch (error) {
    alert(`Registration failed: ${error.message}`);
  }
}

// Update the UI based on authentication status
function updateAuthUI() {
  const isLoggedIn = window.authAPI.isLoggedIn();
  const user = window.authAPI.getCurrentUser();
  
  // Get all auth-related elements
  const authButtons = document.querySelectorAll('.auth-button');
  const userMenus = document.querySelectorAll('.user-menu');
  
  if (isLoggedIn && user) {
    // Update UI for logged in user
    authButtons.forEach(button => {
      button.style.display = 'none';
    });
    
    userMenus.forEach(menu => {
      menu.style.display = 'flex';
      const nameElement = menu.querySelector('.user-name');
      if (nameElement) {
        nameElement.textContent = user.name;
      }
    });
  } else {
    // Update UI for logged out user
    authButtons.forEach(button => {
      button.style.display = 'block';
    });
    
    userMenus.forEach(menu => {
      menu.style.display = 'none';
    });
  }
}

// Handle logout
function handleLogout() {
  window.authAPI.logoutUser();
  updateAuthUI();
  window.location.reload();
}

// Add auth button to navbar
function addAuthButtonToNavbar() {
  const navMenu = document.querySelector('.nav-menu');
  
  if (navMenu) {
    // Create auth button
    const authButton = document.createElement('li');
    authButton.innerHTML = '<a href="#" class="nav-link auth-button" onclick="openAuthModal()">Login / Register</a>';
    
    // Create user menu (hidden by default)
    const userMenu = document.createElement('li');
    userMenu.className = 'user-menu';
    userMenu.style.display = 'none';
    userMenu.innerHTML = `
      <a href="#" class="nav-link user-dropdown">
        <i class="fas fa-user"></i>
        <span class="user-name">User</span>
      </a>
      <div class="dropdown-menu">
        <a href="#" class="dropdown-item" onclick="window.location.href='profile.html'">My Profile</a>
        <a href="#" class="dropdown-item" onclick="window.location.href='bookings.html'">My Bookings</a>
        <a href="#" class="dropdown-item" onclick="handleLogout()">Logout</a>
      </div>
    `;
    
    // Append to nav menu
    navMenu.appendChild(authButton);
    navMenu.appendChild(userMenu);
  }
}

// Initialize auth functionality
function initAuth() {
  // Add auth button to navbar
  addAuthButtonToNavbar();
  
  // Update UI based on auth status
  updateAuthUI();
}

// Add auth modal styles
function addAuthModalStyles() {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    /* Auth Modal Styles */
    .auth-form {
      width: 100%;
    }
    
    .form-switch {
      margin-top: 15px;
      text-align: center;
    }
    
    .form-switch a {
      color: #2ECC71;
      text-decoration: none;
      font-weight: 500;
    }
    
    .form-switch a:hover {
      text-decoration: underline;
    }
    
    .user-menu {
      position: relative;
    }
    
    .user-dropdown {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .dropdown-menu {
      position: absolute;
      top: 100%;
      right: 0;
      background-color: white;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      border-radius: 5px;
      min-width: 180px;
      display: none;
      z-index: 1000;
    }
    
    .user-menu:hover .dropdown-menu {
      display: block;
    }
    
    .dropdown-item {
      display: block;
      padding: 10px 15px;
      color: #1A3C34;
      text-decoration: none;
      transition: background-color 0.3s;
    }
    
    .dropdown-item:hover {
      background-color: #f5f5f5;
    }
  `;
  
  document.head.appendChild(styleElement);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  addAuthModalStyles();
  initAuth();
});

// Export functions
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.showLoginForm = showLoginForm;
window.showRegistrationForm = showRegistrationForm;
window.handleLogout = handleLogout;