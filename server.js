import express from "express";
import mysql from "mysql2";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// ✅ Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // serve frontend

// ✅ MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1082005", // change if needed
  database: "hotel_management"
});

db.connect(err => {
  if (err) {
    console.error("❌ MySQL connection error:", err);
    process.exit(1);
  }
  console.log("✅ Connected to MySQL database.");
});

// ==================== API ROUTES ====================

// ✅ Get all rooms with pagination + filters
app.get("/api/rooms", (req, res) => {
  const { page = 1, limit = 10, q = "", status = "" } = req.query;
  const offset = (page - 1) * limit;

  let where = "WHERE 1=1";
  let params = [];

  if (q) {
    where += " AND (number LIKE ? OR type LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  if (status) {
    where += " AND status=?";
    params.push(status);
  }

  db.query(`SELECT COUNT(*) AS total FROM rooms ${where}`, params, (err, countResult) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query(
      `SELECT * FROM rooms ${where} LIMIT ?, ?`,
      [...params, Number(offset), Number(limit)],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ total: countResult[0].total, rows });
      }
    );
  });
});

// ✅ Add a new room
app.post("/api/rooms", (req, res) => {
  const { number, type, capacity, price_per_night, status } = req.body;
  if (!number || !type || !capacity || !price_per_night) {
    return res.status(400).json({ error: "Missing room details" });
  }
  db.query(
    "INSERT INTO rooms (number, type, capacity, price_per_night, status) VALUES (?, ?, ?, ?, ?)",
    [number, type, capacity, price_per_night, status || "available"],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "✅ Room added successfully", roomId: result.insertId });
    }
  );
});

// ✅ Delete room
app.delete("/api/rooms/:id", (req, res) => {
  db.query("DELETE FROM rooms WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "✅ Room deleted" });
  });
});

// ✅ Search available rooms
app.get("/api/rooms/available", (req, res) => {
  const { check_in, check_out, type } = req.query;

  let query = `
    SELECT * FROM rooms 
    WHERE status='available' 
    AND id NOT IN (
      SELECT room_id FROM bookings 
      WHERE (check_in <= ? AND check_out >= ?)
    )
  `;
  let params = [check_out, check_in];

  if (type) {
    query += " AND type=?";
    params.push(type);
  }

  db.query(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ✅ Get bookings (paginated + search)
app.get("/api/bookings", (req, res) => {
  const { page = 1, limit = 10, q = "" } = req.query;
  const offset = (page - 1) * limit;

  let where = "WHERE 1=1";
  let params = [];

  if (q) {
    where += " AND (b.guest_name LIKE ? OR b.guest_phone LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }

  db.query(`SELECT COUNT(*) AS total FROM bookings b ${where}`, params, (err, countResult) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query(
      `SELECT b.id, b.guest_name, b.guest_phone, b.check_in, b.check_out, 
              r.number AS room_number, r.type AS room_type
       FROM bookings b 
       JOIN rooms r ON b.room_id = r.id
       ${where} LIMIT ?, ?`,
      [...params, Number(offset), Number(limit)],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ total: countResult[0].total, rows });
      }
    );
  });
});

// ✅ Add booking
app.post("/api/bookings", (req, res) => {
  const { guest_name, guest_phone, room_id, check_in, check_out } = req.body;
  if (!guest_name || !room_id || !check_in || !check_out) {
    return res.status(400).json({ error: "Missing booking details" });
  }
  db.query(
    "INSERT INTO bookings (guest_name, guest_phone, room_id, check_in, check_out) VALUES (?, ?, ?, ?, ?)",
    [guest_name, guest_phone || null, room_id, check_in, check_out],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "✅ Booking created successfully", bookingId: result.insertId });
    }
  );
});

// ✅ Delete booking
app.delete("/api/bookings/:id", (req, res) => {
  db.query("DELETE FROM bookings WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "✅ Booking deleted" });
  });
});

// ✅ Get staff
app.get("/api/staff", (req, res) => {
  const { page = 1, limit = 10, q = "" } = req.query;
  const offset = (page - 1) * limit;

  let where = "WHERE 1=1";
  let params = [];

  if (q) {
    where += " AND (name LIKE ? OR role LIKE ? OR email LIKE ?)";
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  db.query(`SELECT COUNT(*) AS total FROM staff ${where}`, params, (err, countResult) => {
    if (err) return res.status(500).json({ error: err.message });

    db.query(
      `SELECT * FROM staff ${where} LIMIT ?, ?`,
      [...params, Number(offset), Number(limit)],
      (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ total: countResult[0].total, rows });
      }
    );
  });
});

// ✅ Add staff
app.post("/api/staff", (req, res) => {
  const { name, role, phone, email } = req.body;
  if (!name || !role) return res.status(400).json({ error: "Missing staff details" });
  db.query(
    "INSERT INTO staff (name, role, phone, email) VALUES (?, ?, ?, ?)",
    [name, role, phone || null, email || null],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "✅ Staff added successfully", staffId: result.insertId });
    }
  );
});

// ✅ Delete staff
app.delete("/api/staff/:id", (req, res) => {
  db.query("DELETE FROM staff WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "✅ Staff deleted" });
  });
});

// =====================================================

// Serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
