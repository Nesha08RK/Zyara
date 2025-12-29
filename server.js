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
  password: "Ragavi_31", // change if needed
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

// ✅ Update room status
app.patch("/api/rooms/:id/status", (req, res) => {
  const { status } = req.body;
  if (!status || !['available', 'booked', 'maintenance'].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  db.query("UPDATE rooms SET status=? WHERE id=?", [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "✅ Room status updated", status });
  });
});

// ✅ Search available rooms
app.get("/api/rooms/available", (req, res) => {
  const { check_in, check_out, check_in_time, check_out_time, at, type } = req.query;

  // Helper to normalize incoming 'at' ISO to MySQL DATETIME string (YYYY-MM-DD HH:MM:SS)
  const normalizeAt = (iso) => {
    if (!iso) return null;
    // Allow strings like 2025-11-26T14:00:00Z or 2025-11-26T14:00:00
    return iso.replace('T', ' ').replace('Z', '').split('.')[0];
  };

  let query = "SELECT * FROM rooms WHERE status!='maintenance'"; // exclude rooms under maintenance
  let params = [];

  if (at) {
    // Check bookings that include the 'at' datetime by comparing dates
    const atSql = normalizeAt(at);
    // Use DATE comparison so missing time columns won't break the query
    query += ` AND id NOT IN (
      SELECT room_id FROM bookings
      WHERE check_in <= ? AND check_out >= ?
    )`;
    params.push(atSql.split(' ')[0], atSql.split(' ')[0]);
  } else if (check_in && check_out) {
    // Use provided date ranges (date-only overlap check)
    // A booking overlaps desired range if NOT (booking.check_out < desired.check_in OR booking.check_in > desired.check_out)
    query += ` AND id NOT IN (
      SELECT room_id FROM bookings
      WHERE check_out < ? OR check_in > ?
    )`;
    // We want rooms NOT IN bookings where (booking ends before desired start) OR (booking starts after desired end)
    // To invert correctly, pass desired.check_in and desired.check_out
    params.push(check_in, check_out);
  } else {
    // If no params, treat as 'at' == today
    const now = new Date();
    const nowSql = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().replace('T', ' ').split('.')[0];
    query += ` AND id NOT IN (
      SELECT room_id FROM bookings
      WHERE check_in <= ? AND check_out >= ?
    )`;
    params.push(nowSql.split(' ')[0], nowSql.split(' ')[0]);
  }

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
      `SELECT b.id, b.guest_name, b.guest_phone, b.check_in, b.check_in_time, b.check_out, b.check_out_time,
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
  const { guest_name, guest_phone, room_id, check_in, check_in_time, check_out, check_out_time, id_proof_type, id_proof_number } = req.body;

  // Basic required fields
  if (!guest_name || !room_id || !check_in || !check_out) {
    return res.status(400).json({ error: "Missing booking details" });
  }

  // Validate ID proof presence and basic format (server-side only; not persisted)
  if (!id_proof_type || !id_proof_number) {
    return res.status(400).json({ error: "ID proof type and number are required" });
  }
  const isValidAadhaar = (val) => {
    const cleaned = String(val || '').replace(/\s/g, '');
    if (!/^\d{12}$/.test(cleaned)) return false;
    // simple Verhoeff implementation
    const d = [
      [0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]
    ];
    const p = d; const inv = [0,4,3,2,1,5,6,7,8,9];
    let c=0; const digits = cleaned.split('').map(Number);
    for (let i=digits.length-1;i>=0;i--) c = d[c][p[(digits.length-i)%8][digits[i]]];
    return inv[c]===0;
  };
  const isValidPassport = (val) => /^[A-Z0-9]{6,9}$/i.test(String(val||'').trim());

  if (id_proof_type === 'Aadhaar' && !isValidAadhaar(id_proof_number)) return res.status(400).json({ error: 'Invalid Aadhaar number' });
  if (id_proof_type === 'Passport' && !isValidPassport(id_proof_number)) return res.status(400).json({ error: 'Invalid passport number' });
  if (id_proof_type === 'Other' && String(id_proof_number).trim().length < 3) return res.status(400).json({ error: 'Invalid ID number' });

  // Validate dates and minimum 24-hour duration
  try {
    const start = new Date(check_in + 'T' + (check_in_time || '00:00'));
    const end = new Date(check_out + 'T' + (check_out_time || '00:00'));
    const now = new Date();
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return res.status(400).json({ error: 'Invalid date/time' });
    // check-in not in past (allow same-day if time is later than now)
    const todayDateOnly = new Date(now.getTime() - now.getTimezoneOffset()*60000).toISOString().split('T')[0];
    if (check_in < todayDateOnly) return res.status(400).json({ error: 'Check-in cannot be in the past' });
    if (end.getTime() <= start.getTime()) return res.status(400).json({ error: 'Check-out must be after check-in' });
    if ((end.getTime() - start.getTime()) < 24 * 60 * 60 * 1000) return res.status(400).json({ error: 'Booking must be at least 24 hours' });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid booking dates/times' });
  }

  // Ensure room exists and is not under maintenance
  // Accept either numeric room `id` or room `number` entered by user
  console.log('Booking request received for room_id:', room_id);
  db.query('SELECT * FROM rooms WHERE id=? OR number=?', [room_id, room_id], (err, roomRows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!roomRows || roomRows.length === 0) return res.status(400).json({ error: 'Room not found' });
    const room = roomRows[0];
    if (room.status === 'maintenance') return res.status(400).json({ error: 'Room under maintenance' });

    // Check for overlapping bookings for this room (date-only safe check)
    const overlapQuery = `SELECT * FROM bookings WHERE room_id=? AND NOT (check_out < ? OR check_in > ?)`;
    db.query(overlapQuery, [room_id, check_in, check_out], (err, overlaps) => {
      if (err) return res.status(500).json({ error: err.message });
      if (overlaps && overlaps.length > 0) return res.status(400).json({ error: 'Room is already booked for the selected dates' });

      // Insert booking (we don't persist ID proof fields for now)
      db.query('SHOW COLUMNS FROM bookings', (err, cols) => {
        if (err) return res.status(500).json({ error: err.message });
        const fields = cols.map(c => c.Field);
        const hasCheckInTime = fields.includes('check_in_time');
        const hasCheckOutTime = fields.includes('check_out_time');
        const insertCols = ['guest_name','guest_phone','room_id','check_in'];
        const values = [guest_name, guest_phone || null, room_id, check_in];
        if (hasCheckInTime) { insertCols.push('check_in_time'); values.push(check_in_time || null); }
        if (!insertCols.includes('check_out')) { insertCols.push('check_out'); }
        // ensure check_out placed after check_in (it already will be)
        values.push(check_out);
        if (hasCheckOutTime) { insertCols.push('check_out_time'); values.push(check_out_time || null); }

        const placeholders = insertCols.map(_=>'?').join(', ');
        const sql = `INSERT INTO bookings (${insertCols.join(', ')}) VALUES (${placeholders})`;
        db.query(sql, values, (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          return res.json({ message: "✅ Booking created successfully", bookingId: result.insertId });
        });
      });
    });
  });
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
  
  // Allow phone and email to be optional, but if provided they must be unique
  db.query(
    "INSERT INTO staff (name, role, phone, email) VALUES (?, ?, ?, ?)",
    [name, role, phone || null, email || null],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          if (err.sqlMessage && err.sqlMessage.includes('phone')) {
            return res.status(400).json({ error: "Phone number already exists" });
          }
          if (err.sqlMessage && err.sqlMessage.includes('email')) {
            return res.status(400).json({ error: "Email already exists" });
          }
          return res.status(400).json({ error: "Phone or Email already exists" });
        }
        return res.status(500).json({ error: err.message });
      }
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
