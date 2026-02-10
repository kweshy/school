const crypto = require("crypto");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const pool = require("./db.JS"); // your PostgreSQL connection file

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public'));
/* ============================
   GMAIL NODEMAILER SETUP
============================ */

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false  // <- ignore self-signed certificate
  }
});



/* ============================
   REGISTER ROUTE
============================ */

app.post("/api/register", async (req, res) => {
  const { fullname, role, grade_group, email, password } = req.body;

  // 1️⃣ Basic checks
  if (!fullname || !role || !email || !password) {
    return res.status(400).json({ message: "Full name, role, email, and password are required" });
  }

  // 2️⃣ Teachers must have a grade group
  if (role === "Teacher" && (!grade_group || grade_group === "")) {
    return res.status(400).json({ message: "Grade group is required for teachers" });
  }

  try {
    // 3️⃣ Enforce only one Admin
    if (role === "Admin") {
      const existingAdmin = await pool.query("SELECT * FROM users WHERE role = $1", ["Admin"]);
      if (existingAdmin.rows.length > 0) {
        return res.status(400).json({ message: "An Admin already exists" });
      }
    }

    // 4️⃣ Check if email already exists
    const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // 5️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6️⃣ Insert user (Admin grade_group can be null)
    const dbGradeGroup = role === "Teacher" ? grade_group : null;
    await pool.query(
      `INSERT INTO users (fullname, role, grade_group, email, password)
       VALUES ($1, $2, $3, $4, $5)`,
      [fullname, role, dbGradeGroup, email, hashedPassword]
    );

    // 7️⃣ Send welcome email
    await transporter.sendMail({
      from: '"Little Innovators" <yourschool.system@gmail.com>',
      to: email,
      subject: "Account Created Successfully",
      html: `
        <h3>Hello ${fullname},</h3>
        <p>Your account has been created successfully.</p>
        <p>You can now log in using your email.</p>
      `
    });

    res.json({ message: "Registration successful" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});



/* ============================
   LOGIN ROUTE
============================ */

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    // Fetch user by email
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Email not found" });
    }

    const user = result.rows[0];

    // Compare hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect password" });
    }

    // Return role and grade_group for dashboard redirection
    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        fullname: user.fullname,
        role: user.role,
        grade_group: user.grade_group // this is key for teacher redirection
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/check-admin", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE role = $1',
      ['Admin']
    );
    res.json({ adminExists: result.rows.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ adminExists: false });
  }
});
app.post("/api/send-verification", async (req, res) => {
  const { email } = req.body;

  // generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await transporter.sendMail({
      from: '"Little Innovators" <your-email@gmail.com>',
      to: email,
      subject: "Email Verification",
      html: `<p>Your verification code is: <b>${code}</b></p>`
    });

    // send code back for frontend comparison (simple, for demo)
    res.json({ success: true, code });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

/* ============================
   FORGOT PASSWORD
============================ */

app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // Always return same message (security)
    const genericMessage = {
      message: "If the email exists, a reset link has been sent."
    };

    // Check if user exists
    const user = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.json(genericMessage);
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");

    // Expiry (15 minutes)
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    // Store token
    await pool.query(
      `INSERT INTO password_resets (email, token, expires_at)
       VALUES ($1, $2, $3)`,
      [email, token, expires]
    );

    // Reset link
    const resetLink = `http://localhost:3000/reset-password.html?token=${token}`;

    // Send email
    await transporter.sendMail({
      from: '"Little Innovators" <your-email@gmail.com>',
      to: email,
      subject: "Password Reset",
      html: `
        <p>You requested a password reset.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link expires in 15 minutes.</p>
      `
    });

    res.json(genericMessage);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ============================
   RESET PASSWORD
============================ */

app.post("/api/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: "Invalid request" });
  }

  try {
    // Find token
    const result = await pool.query(
      "SELECT * FROM password_resets WHERE token = $1",
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const reset = result.rows[0];

    // Check expiry
    if (new Date(reset.expires_at) < new Date()) {
      return res.status(400).json({ message: "Token expired" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await pool.query(
      "UPDATE users SET password = $1 WHERE email = $2",
      [hashedPassword, reset.email]
    );

    // Delete used token
    await pool.query(
      "DELETE FROM password_resets WHERE token = $1",
      [token]
    );

    res.json({ message: "Password reset successful" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ----------------------
// STUDENT ROUTES
// ----------------------

// GET all students
app.get("/students", async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM students ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// GET single student by ID
app.get("/students/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("SELECT * FROM students WHERE id = $1", [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Student not found" });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// CREATE new student
app.post("/students", async (req, res) => {
    const { full_name, grade, parent_name, parent_email, phone } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO students (full_name, grade, parent_name, parent_email, phone)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [full_name, grade, parent_name, parent_email, phone]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// UPDATE student by ID
app.put("/students/:id", async (req, res) => {
    const { id } = req.params;
    const { full_name, grade, parent_name, parent_email, phone } = req.body;

    try {
        const result = await pool.query(
            `UPDATE students
             SET full_name=$1, grade=$2, parent_name=$3, parent_email=$4, phone=$5
             WHERE id=$6
             RETURNING *`,
            [full_name, grade, parent_name, parent_email, phone, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: "Student not found" });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// DELETE student by ID
app.delete("/students/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query("DELETE FROM students WHERE id=$1 RETURNING *", [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: "Student not found" });
        res.json({ message: "Student deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
});

// Fetch all registered students (full names only)
app.get('/api/students', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, full_name FROM students'); 
        // include id here
        res.json(result.rows); // now each student object has {id, full_name}
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// to send attendance to database
app.post('/api/attendance', async (req, res) => {
    const { records } = req.body;

    if (!records || !Array.isArray(records)) {
        return res.status(400).json({ success: false, message: 'Invalid data' });
    }

    try {
        for (const rec of records) {
            await pool.query(
                `INSERT INTO attendance (student_id, date, status)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (student_id, date)
                 DO UPDATE SET status = EXCLUDED.status`,
                [rec.student_id, rec.date, rec.status]
            );
        }

        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});


/* ============================
   SERVER START
============================ */

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
