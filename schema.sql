-- Create the database
CREATE DATABASE IF NOT EXISTS hotel_management;
USE hotel_management;

-- ==================== STAFF TABLE ====================
CREATE TABLE IF NOT EXISTS staff (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100)
);

-- ==================== ROOMS TABLE ====================
CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  number VARCHAR(20) UNIQUE NOT NULL,  -- e.g. "101", "A1"
  type VARCHAR(50) NOT NULL,           -- e.g. "Deluxe", "Suite"
  capacity INT NOT NULL,               -- number of people
  price_per_night DECIMAL(10,2) NOT NULL,
  status ENUM('available', 'maintenance') DEFAULT 'available'
);

-- ==================== BOOKINGS TABLE ====================
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guest_name VARCHAR(100) NOT NULL,
  guest_phone VARCHAR(20),
  room_id INT NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- ==================== STAFF ASSIGNMENTS ====================
CREATE TABLE IF NOT EXISTS staff_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  booking_id INT NOT NULL,
  staff_id INT NOT NULL,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

-- ==================== SAMPLE DATA ====================

