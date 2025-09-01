const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const db = new Database(path.join(__dirname, 'hotel.db'));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Schema initialization
db.exec(`
CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  email TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  price_per_night REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'available'
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guest_name TEXT NOT NULL,
  guest_phone TEXT,
  room_id INTEGER NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE TABLE IF NOT EXISTS staff_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_id INTEGER NOT NULL,
  staff_id INTEGER NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(booking_id, staff_id),
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (staff_id) REFERENCES staff(id)
);
`);

// Utility: date overlap
function hasOverlap(aStart, aEnd, bStart, bEnd) {
  return new Date(aStart) < new Date(bEnd) && new Date(bStart) < new Date(aEnd);
}

function buildPaginationAndSort(query, allowedSort = []) {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '10', 10), 1), 100);
  const offset = (page - 1) * limit;
  let sort = '';
  if (query.sort && allowedSort.includes(query.sort)) {
    const dir = (query.dir || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';
    sort = ` ORDER BY ${query.sort} ${dir} `;
  }
  return { page, limit, offset, sort };
}

// Staff routes
app.get('/api/staff', (req, res) => {
  const { q } = req.query;
  const { limit, offset, sort } = buildPaginationAndSort(req.query, ['id','name','role']);
  const where = q ? ' WHERE name LIKE ? OR role LIKE ? OR phone LIKE ? OR email LIKE ? ' : ' ';
  const params = q ? Array(4).fill(`%${q}%`) : [];
  const total = db.prepare('SELECT COUNT(*) as c FROM staff' + (q ? ' WHERE name LIKE ? OR role LIKE ? OR phone LIKE ? OR email LIKE ? ' : '')).get(...params).c;
  const rows = db.prepare('SELECT * FROM staff' + where + (sort || ' ORDER BY id DESC ') + ' LIMIT ? OFFSET ?').all(...params, limit, offset);
  res.json({ total, rows });
});

app.post('/api/staff', (req, res) => {
  const { name, role, phone, email } = req.body;
  const stmt = db.prepare('INSERT INTO staff (name, role, phone, email) VALUES (?, ?, ?, ?)');
  const info = stmt.run(name, role, phone || null, email || null);
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/staff/:id', (req, res) => {
  const { id } = req.params;
  const { name, role, phone, email } = req.body;
  const stmt = db.prepare('UPDATE staff SET name=?, role=?, phone=?, email=? WHERE id=?');
  const info = stmt.run(name, role, phone || null, email || null, id);
  res.json({ changes: info.changes });
});

app.delete('/api/staff/:id', (req, res) => {
  const { id } = req.params;
  const info = db.prepare('DELETE FROM staff WHERE id=?').run(id);
  res.json({ changes: info.changes });
});

// Room routes
app.get('/api/rooms', (req, res) => {
  const { q, type, status } = req.query;
  const { limit, offset, sort } = buildPaginationAndSort(req.query, ['id','number','type','price_per_night','capacity']);
  const clauses = [];
  const params = [];
  if (q) { clauses.push('(number LIKE ? OR type LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (type) { clauses.push('type = ?'); params.push(type); }
  if (status) { clauses.push('status = ?'); params.push(status); }
  const where = clauses.length ? ' WHERE ' + clauses.join(' AND ') + ' ' : ' ';
  const total = db.prepare('SELECT COUNT(*) as c FROM rooms' + where).get(...params).c;
  const rows = db.prepare('SELECT * FROM rooms' + where + (sort || ' ORDER BY number ') + ' LIMIT ? OFFSET ?').all(...params, limit, offset);
  res.json({ total, rows });
});

app.post('/api/rooms', (req, res) => {
  const { number, type, capacity, price_per_night, status } = req.body;
  const stmt = db.prepare('INSERT INTO rooms (number, type, capacity, price_per_night, status) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(number, type, capacity, price_per_night, status || 'available');
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/rooms/:id', (req, res) => {
  const { id } = req.params;
  const { number, type, capacity, price_per_night, status } = req.body;
  const stmt = db.prepare('UPDATE rooms SET number=?, type=?, capacity=?, price_per_night=?, status=? WHERE id=?');
  const info = stmt.run(number, type, capacity, price_per_night, status, id);
  res.json({ changes: info.changes });
});

app.delete('/api/rooms/:id', (req, res) => {
  const { id } = req.params;
  const info = db.prepare('DELETE FROM rooms WHERE id=?').run(id);
  res.json({ changes: info.changes });
});

// Available rooms search
app.get('/api/rooms/available', (req, res) => {
  const { check_in, check_out, type } = req.query;
  const rooms = db.prepare('SELECT * FROM rooms WHERE status = \'available\'' + (type ? ' AND type = ?' : '')).all(type ? [type] : []);
  const bookings = db.prepare('SELECT * FROM bookings').all();
  const filtered = rooms.filter(r => {
    const conflicts = bookings.filter(b => b.room_id === r.id && hasOverlap(check_in, check_out, b.check_in, b.check_out));
    return conflicts.length === 0;
  });
  res.json(filtered);
});

// Booking routes
app.get('/api/bookings', (req, res) => {
  const { q } = req.query;
  const { limit, offset, sort } = buildPaginationAndSort(req.query, ['id','check_in','check_out','created_at']);
  const where = q ? ' WHERE guest_name LIKE ? OR guest_phone LIKE ? ' : ' ';
  const params = q ? [`%${q}%`, `%${q}%`] : [];
  const total = db.prepare('SELECT COUNT(*) as c FROM bookings' + where).get(...params).c;
  const rows = db.prepare(`
    SELECT b.*, r.number AS room_number, r.type AS room_type
    FROM bookings b JOIN rooms r ON r.id = b.room_id
    ${where}
    ${sort || ' ORDER BY b.id DESC '}
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);
  res.json({ total, rows });
});

app.post('/api/bookings', (req, res) => {
  const { guest_name, guest_phone, room_id, check_in, check_out } = req.body;
  // prevent overlaps
  const overlaps = db.prepare('SELECT * FROM bookings WHERE room_id = ?').all(room_id).some(b => hasOverlap(check_in, check_out, b.check_in, b.check_out));
  if (overlaps) return res.status(400).json({ error: 'Room already booked for selected dates' });
  const stmt = db.prepare('INSERT INTO bookings (guest_name, guest_phone, room_id, check_in, check_out) VALUES (?, ?, ?, ?, ?)');
  const info = stmt.run(guest_name, guest_phone || null, room_id, check_in, check_out);
  res.json({ id: info.lastInsertRowid });
});

app.put('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const { guest_name, guest_phone, room_id, check_in, check_out } = req.body;
  const overlaps = db.prepare('SELECT * FROM bookings WHERE room_id = ? AND id != ?').all(room_id, id).some(b => hasOverlap(check_in, check_out, b.check_in, b.check_out));
  if (overlaps) return res.status(400).json({ error: 'Room already booked for selected dates' });
  const info = db.prepare('UPDATE bookings SET guest_name=?, guest_phone=?, room_id=?, check_in=?, check_out=? WHERE id=?').run(guest_name, guest_phone || null, room_id, check_in, check_out, id);
  res.json({ changes: info.changes });
});

app.delete('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const info = db.prepare('DELETE FROM bookings WHERE id=?').run(id);
  res.json({ changes: info.changes });
});

// Staff availability for a booking window
app.get('/api/staff/available', (req, res) => {
  const { check_in, check_out, role } = req.query;
  // staff with no assignments overlapping the window
  const allStaff = role
    ? db.prepare('SELECT * FROM staff WHERE role = ?').all(role)
    : db.prepare('SELECT * FROM staff').all();
  const assignments = db.prepare(`
    SELECT sa.*, b.check_in, b.check_out FROM staff_assignments sa
    JOIN bookings b ON b.id = sa.booking_id
  `).all();
  const available = allStaff.filter(s => !assignments.some(a => a.staff_id === s.id && hasOverlap(check_in, check_out, a.check_in, a.check_out)));
  res.json(available);
});

// Assign staff to booking
app.post('/api/assignments', (req, res) => {
  const { booking_id, staff_id } = req.body;
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(booking_id);
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  // ensure staff not overlapping
  const conflicts = db.prepare(`
    SELECT sa.*, b.check_in, b.check_out FROM staff_assignments sa
    JOIN bookings b ON b.id = sa.booking_id
    WHERE sa.staff_id = ?
  `).all(staff_id).some(a => hasOverlap(booking.check_in, booking.check_out, a.check_in, a.check_out));
  if (conflicts) return res.status(400).json({ error: 'Staff already assigned during these dates' });
  const info = db.prepare('INSERT OR IGNORE INTO staff_assignments (booking_id, staff_id) VALUES (?, ?)').run(booking_id, staff_id);
  res.json({ id: info.lastInsertRowid });
});

// List assignments for a booking
app.get('/api/assignments', (req, res) => {
  const { booking_id } = req.query;
  const rows = db.prepare(`
    SELECT sa.id, s.name, s.role, s.phone, s.email
    FROM staff_assignments sa JOIN staff s ON s.id = sa.staff_id
    WHERE sa.booking_id = ?
  `).all(booking_id);
  res.json(rows);
});

// Unassign
app.delete('/api/assignments/:id', (req, res) => {
  const { id } = req.params;
  const info = db.prepare('DELETE FROM staff_assignments WHERE id = ?').run(id);
  res.json({ changes: info.changes });
});

// Fallback to SPA (Express v5 compatible wildcard)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));


