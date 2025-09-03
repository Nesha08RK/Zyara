// seed.js
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config(); // load .env file

(async () => {
  try {
    const pool = await mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASS || "",
      multipleStatements: true, // allow running schema.sql
    });

    // Run schema.sql
    const fs = await import("fs/promises");
    const schema = await fs.readFile("./schema.sql", "utf8");
    await pool.query(schema);
    console.log("✅ Database schema created successfully");

    // Insert some seed data
    await pool.query(
      `INSERT INTO staff (name, role, phone, email) VALUES 
      ('Alice Johnson', 'Receptionist', '1234567890', 'alice@example.com'),
      ('Bob Smith', 'Manager', '9876543210', 'bob@example.com')`
    );

    await pool.query(
      `INSERT INTO rooms (number, type, capacity, price_per_night, status) VALUES
      ('101', 'Deluxe', 2, 120.00, 'available'),
      ('102', 'Suite', 4, 250.00, 'maintenance')`
    );

    console.log("✅ Seed data inserted");
    await pool.end();
  } catch (err) {
    console.error("❌ Error seeding database:", err);
  }
})();
