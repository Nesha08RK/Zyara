// Sample room data - prices updated to INR
const rooms = [
    {
        id: 1,
        name: "Standard Room",
        type: "standard",
        price: 9960, // ₹9,960
        image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop",
        description: "Comfortable and elegant rooms perfect for your stay with modern amenities and city views.",
        amenities: ["WiFi", "TV", "AC", "Mini Bar"],
        rating: 4.2,
        capacity: 2,
        available: true,
        badge: null
    },
    {
        id: 2,
        name: "Deluxe Room",
        type: "deluxe",
        price: 16600, // ₹16,600
        image: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=300&fit=crop",
        description: "Spacious rooms with premium amenities, city views, and enhanced comfort for a luxurious experience.",
        amenities: ["WiFi", "TV", "AC", "Mini Bar", "Balcony", "City View"],
        rating: 4.5,
        capacity: 3,
        available: true,
        badge: "Popular"
    },
    {
        id: 3,
        name: "Luxury Suite",
        type: "suite",
        price: 29050, // ₹29,050
        image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop",
        description: "Ultimate luxury with separate living area, premium services, and exclusive amenities.",
        amenities: ["WiFi", "TV", "AC", "Mini Bar", "Balcony", "City View", "Spa Access", "Butler Service"],
        rating: 4.8,
        capacity: 4,
        available: true,
        badge: "Premium"
    },
    {
        id: 4,
        name: "Presidential Suite",
        type: "presidential",
        price: 66400, // ₹66,400
        image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop",
        description: "The epitome of luxury with panoramic views, private terrace, and world-class service.",
        amenities: ["WiFi", "TV", "AC", "Mini Bar", "Private Terrace", "Panoramic View", "Spa Access", "Butler Service", "Private Pool"],
        rating: 5.0,
        capacity: 6,
        available: true,
        badge: "VIP"
    },
    {
        id: 5,
        name: "Family Suite",
        type: "suite",
        price: 23240, // ₹23,240
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
        description: "Perfect for families with connecting rooms, spacious layout, and child-friendly amenities.",
        amenities: ["WiFi", "TV", "AC", "Mini Bar", "Connecting Rooms", "Child-Friendly"],
        rating: 4.3,
        capacity: 5,
        available: true,
        badge: "Family"
    },
    {
        id: 6,
        name: "Business Suite",
        type: "suite",
        price: 26560, // ₹26,560
        image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop",
        description: "Designed for business travelers with work area, meeting facilities, and high-speed internet.",
        amenities: ["WiFi", "TV", "AC", "Mini Bar", "Work Area", "Meeting Facilities", "High-Speed Internet"],
        rating: 4.6,
        capacity: 3,
        available: true,
        badge: "Business"
    }
];

let filteredRooms = [...rooms];
let currentBooking = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    setDefaultDates();
    displayRooms(rooms);
    setupEventListeners();
    setupFileUpload();
    setupPaymentMethods();
    
    // Ensure rooms are visible
    document.getElementById('rooms-grid').style.display = 'grid';
});

// Set default check-in and check-out dates
function setDefaultDates() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const checkinDate = document.getElementById('checkin-date');
    const checkoutDate = document.getElementById('checkout-date');
    
    checkinDate.value = today.toISOString().split('T')[0];
    checkoutDate.value = tomorrow.toISOString().split('T')[0];
    
    // Set minimum dates
    checkinDate.min = today.toISOString().split('T')[0];
    checkoutDate.min = tomorrow.toISOString().split('T')[0];
}

// Setup event listeners
function setupEventListeners() {
    // Date change listeners
    document.getElementById('checkin-date').addEventListener('change', function() {
        const checkoutDate = document.getElementById('checkout-date');
        const minCheckout = new Date(this.value);
        minCheckout.setDate(minCheckout.getDate() + 1);
        checkoutDate.min = minCheckout.toISOString().split('T')[0];
        
        if (checkoutDate.value <= this.value) {
            checkoutDate.value = minCheckout.toISOString().split('T')[0];
        }
    });
    
    // Form submission
    document.getElementById('bookingForm').addEventListener('submit', handleBookingSubmission);
    
    // Modal close events
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeBookingModal();
        }
    });
}

// Setup file upload functionality
function setupFileUpload() {
    const fileInput = document.getElementById('id-upload');
    const uploadArea = document.querySelector('.upload-area');
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                alert('File size must be less than 5MB');
                this.value = '';
                return;
            }
            
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                alert('Please upload JPG, PNG, or PDF files only');
                this.value = '';
                return;
            }
            
            // Update upload area
            uploadArea.innerHTML = `
                <i class="fas fa-check-circle" style="color: #28a745;"></i>
                <p>${file.name}</p>
                <span>File uploaded successfully</span>
            `;
        }
    });
    
    // Drag and drop functionality
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.borderColor = '#764ba2';
        this.style.background = '#e9ecef';
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.style.borderColor = '#667eea';
        this.style.background = '#f8f9fa';
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.borderColor = '#667eea';
        this.style.background = '#f8f9fa';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            fileInput.dispatchEvent(new Event('change'));
        }
    });
}

// Setup payment methods
function setupPaymentMethods() {
    const paymentOptions = document.querySelectorAll('input[name="payment"]');
    const creditCardForm = document.getElementById('credit-card-form');
    
    paymentOptions.forEach(option => {
        option.addEventListener('change', function() {
            if (this.value === 'credit-card') {
                creditCardForm.style.display = 'block';
            } else {
                creditCardForm.style.display = 'none';
            }
        });
    });
}

// Search rooms function
function searchRooms() {
    const checkinDate = document.getElementById('checkin-date').value;
    const checkoutDate = document.getElementById('checkout-date').value;
    const guests = document.getElementById('guests').value;
    const roomType = document.getElementById('room-type').value;
    const priceRange = document.getElementById('price-range').value;
    const amenities = document.getElementById('amenities').value;
    
    // Filter rooms based on criteria
    filteredRooms = rooms.filter(room => {
        // Room type filter
        if (roomType && room.type !== roomType) return false;
        
        // Capacity filter
        if (guests && room.capacity < parseInt(guests)) return false;
        
        // Price range filter
        if (priceRange) {
            const [min, max] = priceRange.split('-').map(p => p === '+' ? Infinity : parseInt(p));
            if (room.price < min || (max !== Infinity && room.price > max)) return false;
        }
        
        // Amenities filter
        if (amenities && !room.amenities.some(amenity => 
            amenity.toLowerCase().includes(amenities.toLowerCase()))) return false;
        
        return true;
    });
    
    displayRooms(filteredRooms);
    updateResultsCount();
}

// Clear filters function
function clearFilters() {
    document.getElementById('checkin-date').value = '';
    document.getElementById('checkout-date').value = '';
    document.getElementById('guests').value = '2';
    document.getElementById('room-type').value = '';
    document.getElementById('price-range').value = '';
    document.getElementById('amenities').value = '';
    
    setDefaultDates();
    filteredRooms = [...rooms];
    displayRooms(filteredRooms);
    updateResultsCount();
}

// Sort rooms function
function sortRooms() {
    const sortBy = document.getElementById('sort-by').value;
    
    filteredRooms.sort((a, b) => {
        switch(sortBy) {
            case 'price-low':
                return a.price - b.price;
            case 'price-high':
                return b.price - a.price;
            case 'rating':
                return b.rating - a.rating;
            case 'popularity':
                return b.id - a.id; // Simple popularity based on ID
            default:
                return 0;
        }
    });
    
    displayRooms(filteredRooms);
}

// Format price to INR
function formatPrice(price) {
    return '₹' + price.toLocaleString('en-IN');
}

// Display rooms in the grid
function displayRooms(roomsToShow) {
    const roomsGrid = document.getElementById('rooms-grid');
    roomsGrid.innerHTML = '';
    roomsGrid.style.display = 'grid';
    
    if (roomsToShow.length === 0) {
        roomsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                <i class="fas fa-search" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No rooms found</h3>
                <p>Try adjusting your search criteria</p>
            </div>
        `;
        return;
    }
    
    roomsToShow.forEach(room => {
        const roomCard = createRoomCard(room);
        roomsGrid.appendChild(roomCard);
    });
}

// Create room card element
function createRoomCard(room) {
    const card = document.createElement('div');
    card.className = 'room-card';
    
    const amenitiesHTML = room.amenities.map(amenity => 
        `<span class="amenity-tag">${amenity}</span>`
    ).join('');
    
    const badgeHTML = room.badge ? `<div class="room-badge">${room.badge}</div>` : '';
    
    card.innerHTML = `
        <div class="room-image">
            <img src="${room.image}" alt="${room.name}">
            ${badgeHTML}
        </div>
        <div class="room-info">
            <div class="room-header">
                <div class="room-title">
                    <h3>${room.name}</h3>
                    <div class="room-rating">
                        <i class="fas fa-star"></i>
                        <span>${room.rating}</span>
                        <span>(${Math.floor(Math.random() * 100) + 50} reviews)</span>
                    </div>
                </div>
                <div class="room-price">
                    <div class="price-amount">${formatPrice(room.price)}</div>
                    <div class="price-period">per night</div>
                </div>
            </div>
            <p class="room-description">${room.description}</p>
            <div class="room-amenities">
                ${amenitiesHTML}
            </div>
            <div class="room-actions">
                <button class="btn-view" onclick="viewRoomDetails(${room.id})">
                    <i class="fas fa-eye"></i>
                    View Details
                </button>
                <button class="btn-book" onclick="bookRoom(${room.id})">
                    <i class="fas fa-bed"></i>
                    Book Now
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Update results count
function updateResultsCount() {
    const count = filteredRooms.length;
    const countElement = document.getElementById('results-count');
    countElement.textContent = `${count} room${count !== 1 ? 's' : ''} found`;
}

// View room details
function viewRoomDetails(roomId) {
    const room = rooms.find(r => r.id === roomId);
    if (room) {
        alert(`Room Details:\n\nName: ${room.name}\nPrice: ${formatPrice(room.price)}/night\nRating: ${room.rating}/5\nCapacity: ${room.capacity} guests\nAmenities: ${room.amenities.join(', ')}`);
    }
}

// Book room function
function bookRoom(roomId) {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;
    
    const checkinDate = document.getElementById('checkin-date').value;
    const checkoutDate = document.getElementById('checkout-date').value;
    const guests = document.getElementById('guests').value;
    
    if (!checkinDate || !checkoutDate) {
        alert('Please select check-in and check-out dates');
        return;
    }
    
    // Calculate total price
    const checkin = new Date(checkinDate);
    const checkout = new Date(checkoutDate);
    const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
    const total = room.price * nights;
    const formattedTotal = formatPrice(total);
    
    // Store current booking
    currentBooking = {
        room: room,
        checkin: checkinDate,
        checkout: checkoutDate,
        guests: guests,
        nights: nights,
        total: total
    };
    
    // Update booking summary
    document.getElementById('booking-room-name').textContent = room.name;
    document.getElementById('booking-checkin').textContent = checkinDate;
    document.getElementById('booking-checkout').textContent = checkoutDate;
    document.getElementById('booking-guests').textContent = guests;
    document.getElementById('booking-total').textContent = `$${total}`;
    
    // Show booking modal
    document.getElementById('bookingModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close booking modal
function closeBookingModal() {
    document.getElementById('bookingModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    currentBooking = null;
}

// Handle booking form submission
function handleBookingSubmission(e) {
    e.preventDefault();
    
    if (!currentBooking) {
        alert('No booking selected');
        return;
    }
    
    // Get form data
    const formData = new FormData(e.target);
    const bookingData = {
        ...currentBooking,
        guestName: document.getElementById('guest-name').value,
        guestEmail: document.getElementById('guest-email').value,
        guestPhone: document.getElementById('guest-phone').value,
        guestNationality: document.getElementById('guest-nationality').value,
        specialRequests: document.getElementById('special-requests').value,
        idType: document.getElementById('id-type').value,
        idNumber: document.getElementById('id-number').value,
        paymentMethod: document.querySelector('input[name="payment"]:checked').value
    };
    
    // Validate required fields
    if (!bookingData.guestName || !bookingData.guestEmail || !bookingData.guestPhone || 
        !bookingData.guestNationality || !bookingData.idType || !bookingData.idNumber) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Validate file upload
    const fileInput = document.getElementById('id-upload');
    if (!fileInput.files[0]) {
        alert('Please upload your ID proof');
        return;
    }
    
    // Validate terms acceptance
    if (!document.getElementById('terms-accept').checked || 
        !document.getElementById('cancellation-policy').checked) {
        alert('Please accept the terms and conditions and cancellation policy');
        return;
    }
    
    // Simulate booking processing
    showLoadingState();
    
    setTimeout(() => {
        hideLoadingState();
        showSuccessModal(bookingData);
    }, 2000);
}

// Show loading state
function showLoadingState() {
    const submitBtn = document.querySelector('#bookingForm button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;
}

// Hide loading state
function hideLoadingState() {
    const submitBtn = document.querySelector('#bookingForm button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-lock"></i> Confirm Booking';
    submitBtn.disabled = false;
}

// Show success modal
function showSuccessModal(bookingData) {
    // Generate booking ID
    const bookingId = `HMS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    
    // Update success modal
    document.getElementById('booking-id').textContent = bookingId;
    document.getElementById('success-room-name').textContent = bookingData.room.name;
    document.getElementById('success-checkin').textContent = bookingData.checkin;
    
    // Close booking modal and show success modal
    closeBookingModal();
    document.getElementById('successModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close success modal
function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    window.location.href = 'home.html';
}

// Download receipt
function downloadReceipt() {
    alert('Receipt download feature will be implemented in the full version');
}

// Show terms and conditions
function showTerms() {
    alert('Terms and Conditions will be displayed in a modal in the full version');
}

// Show privacy policy
function showPrivacy() {
    alert('Privacy Policy will be displayed in a modal in the full version');
}

// Show cancellation policy
function showCancellation() {
    alert('Cancellation Policy will be displayed in a modal in the full version');
}

// Initialize the page
setDefaultDates();
displayRooms(rooms);
updateResultsCount();
