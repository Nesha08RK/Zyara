// booking-api.js - Connects the booking form to the backend API

// API base URL
const API_URL = 'http://localhost:3000/api';

// Function to search for available rooms
async function searchAvailableRooms(checkIn, checkOut, adults, children, roomType, priceRange) {
  try {
    // Build query parameters
    const params = new URLSearchParams();
    params.append('checkIn', checkIn);
    params.append('checkOut', checkOut);
    
    if (adults) params.append('adults', adults);
    if (children) params.append('children', children);
    if (roomType) params.append('roomType', roomType);
    if (priceRange) params.append('priceRange', priceRange);
    
    // Make API request
    const response = await fetch(`${API_URL}/booking/available-rooms?${params}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch available rooms');
    }
    
    const data = await response.json();
    return data.rooms;
  } catch (error) {
    console.error('Error searching for rooms:', error);
    throw error;
  }
}

// Function to create a booking
async function createBooking(bookingData) {
  try {
    // Make API request
    const response = await fetch(`${API_URL}/booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create booking');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
}

// Function to get user's bookings
async function getUserBookings() {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('You must be logged in to view your bookings');
    }
    
    // Make API request
    const response = await fetch(`${API_URL}/booking/my-bookings`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch bookings');
    }
    
    const data = await response.json();
    return data.bookings;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
}

// Function to cancel a booking
async function cancelBooking(bookingId) {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('You must be logged in to cancel a booking');
    }
    
    // Make API request
    const response = await fetch(`${API_URL}/booking/cancel/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to cancel booking');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
}

// Export functions
window.hotelAPI = {
  searchAvailableRooms,
  createBooking,
  getUserBookings,
  cancelBooking
};