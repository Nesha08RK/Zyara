// contact-api.js - Handles contact form submissions to the backend API

// API base URL
const API_URL = 'http://localhost:3000/api';

// Function to submit a contact form
async function submitContactForm(formData) {
  try {
    const response = await fetch(`${API_URL}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to submit contact form');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting contact form:', error);
    throw error;
  }
}

// Function to get all contact messages (admin only)
async function getAllContactMessages() {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${API_URL}/contact`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch contact messages');
    }
    
    const data = await response.json();
    return data.messages;
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    throw error;
  }
}

// Function to update a message status (admin only)
async function updateMessageStatus(messageId, status) {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${API_URL}/contact/${messageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update message status');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating message status:', error);
    throw error;
  }
}

// Export functions
window.contactAPI = {
  submitContactForm,
  getAllContactMessages,
  updateMessageStatus
};