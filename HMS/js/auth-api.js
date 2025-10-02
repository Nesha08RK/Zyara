// auth-api.js - Handles user authentication with the backend API

// API base URL
const API_URL = 'http://localhost:3000/api';

// Function to register a new user
async function registerUser(userData) {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed');
    }
    
    const data = await response.json();
    
    // Store token in localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Error during registration:', error);
    throw error;
  }
}

// Function to login a user
async function loginUser(credentials) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed');
    }
    
    const data = await response.json();
    
    // Store token in localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Error during login:', error);
    throw error;
  }
}

// Function to logout a user
function logoutUser() {
  // Remove token and user data from localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// Function to get the current user's profile
async function getUserProfile() {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${API_URL}/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

// Function to check if user is logged in
function isLoggedIn() {
  return localStorage.getItem('token') !== null;
}

// Function to get the current user
function getCurrentUser() {
  const userJson = localStorage.getItem('user');
  return userJson ? JSON.parse(userJson) : null;
}

// Export functions
window.authAPI = {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  isLoggedIn,
  getCurrentUser
};