// server.js (Final Corrected Version)

// --- 1. Load Environment Variables ---
require('dotenv').config();

// --- 2. Core Module Imports ---
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// --- 3. Database & Security Module Imports ---
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- 4. Initialize Express App ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- 5. MySQL Connection Pool Configuration ---
const pool = mysql.createPool({
     host: process.env.MYSQLHOST,       // Change to MYSQLHOST
    user: process.env.MYSQLUSER,       // Change to MYSQLUSER
    password: process.env.MYSQLPASSWORD, // Change to MYSQLPASSWORD
    database: process.env.MYSQLDATABASE, // Change to MYSQLDATABASE
    port: process.env.MYSQLPORT,         // Add MYSQLPORT
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- 6. Test Database Connection ---
pool.getConnection()
    .then(connection => {
        console.log('✅ MySQL connected successfully!');
        connection.release();
    })
    .catch(err => {
        console.error('❌ MySQL connection error:', err.message);
        process.exit(1);
    });

// --- 7. Middleware Setup ---
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(__dirname));

// --- 8. API Endpoints ---

// =================================================================
// == PATIENT AUTHENTICATION ENDPOINTS ==
// =================================================================

app.post('/api/patients/register', async (req, res) => {
    const { fullName, email, phone, password } = req.body;
    if (!fullName || !password) return res.status(400).json({ message: 'Full name and password are required.' });
    if (!email && !phone) return res.status(400).json({ message: 'Please provide either an email or a phone number.' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userEmail = email || null;
        const userPhone = phone || null;
        await pool.execute('INSERT INTO patients (fullName, email, phone, password) VALUES (?, ?, ?, ?)', [fullName, userEmail, userPhone, hashedPassword]);
        res.status(201).json({ message: 'Registration Successful! You can now log in.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            const message = error.sqlMessage.includes('email') ? 'This email address is already registered.' : 'This phone number is already registered.';
            return res.status(409).json({ message });
        }
        console.error('Patient registration error:', error);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

app.post('/api/patients/login', async (req, res) => {
    const { loginIdentifier, password } = req.body;
    if (!loginIdentifier || !password) return res.status(400).json({ message: 'Login identifier and password are required.' });

    try {
        const [rows] = await pool.execute('SELECT * FROM patients WHERE email = ? OR phone = ?', [loginIdentifier, loginIdentifier]);
        if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials.' });

        const patient = rows[0];
        const isMatch = await bcrypt.compare(password, patient.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

        const token = jwt.sign({ id: patient.id, email: patient.email, phone: patient.phone }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful!', token: token });
    } catch (error) {
        console.error('Patient login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

// =================================================================
// == PATIENT-PROTECTED ENDPOINTS ==
// =================================================================
const protectPatientRoute = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'Not authorized, no token' });
    const token = authHeader.split(' ')[1];
    try {
        req.patient = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

app.post('/api/book-appointment', protectPatientRoute, async (req, res) => {
    const { date, time, message } = req.body;
    const patientId = req.patient.id;
    if (!date || !time) return res.status(400).json({ message: 'Date and Time are required.' });

    try {
        const [patientRows] = await pool.execute('SELECT fullName, email, phone FROM patients WHERE id = ?', [patientId]);
        if (patientRows.length === 0) return res.status(404).json({ message: 'Patient not found.' });

        const { fullName, email, phone } = patientRows[0];
        await pool.execute('INSERT INTO appointments (patient_id, fullName, email, phone, date, time, message, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())', [patientId, fullName, email, phone || '', date, time, message || '', 'Pending']);
        res.status(201).json({ message: 'Appointment booked successfully!' });
    } catch (error) {
        console.error('Appointment booking error:', error);
        res.status(500).json({ message: 'Server error during appointment booking.' });
    }
});

app.get('/api/patients/my-appointments', protectPatientRoute, async (req, res) => {
    const patientId = req.patient.id;
    try {
        const [rows] = await pool.execute(
            'SELECT id, date, time, status, doctor_notes, medical_description FROM appointments WHERE patient_id = ? ORDER BY date DESC',
            [patientId]
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching patient appointments:', error);
        res.status(500).json({ message: 'Server error fetching appointments.' });
    }
});

// =================================================================
// == DOCTOR / ADMIN ENDPOINTS ==
// =================================================================

app.post('/api/doctor-login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username and password are required.' });
    
    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) return res.status(401).json({ message: 'Invalid username or password.' });

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid username or password.' });
        
        res.status(200).json({ message: 'Login successful!', token: 'mock-admin-jwt-token' });
    } catch (error) {
        console.error('Doctor login error:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

app.get('/api/admin/appointments', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM appointments ORDER BY createdAt DESC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ message: 'Server error fetching appointments.' });
    }
});

app.get('/api/admin/patients', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT id, fullName, email, createdAt FROM patients ORDER BY createdAt DESC');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ message: 'Server error fetching patients.' });
    }
});

app.get('/api/admin/analytics', async (req, res) => {
    try {
        const [pendingResult] = await pool.execute("SELECT COUNT(id) as pendingCount FROM appointments WHERE status = 'Pending'");
        const pendingCount = pendingResult[0].pendingCount;

        const today = new Date().toISOString().slice(0, 10);
        const [todayResult] = await pool.execute("SELECT COUNT(id) as todayCount FROM appointments WHERE date = ?", [today]);
        const todayCount = todayResult[0].todayCount;

        const [patientsResult] = await pool.execute("SELECT COUNT(id) as totalPatients FROM patients");
        const totalPatients = patientsResult[0].totalPatients;

        const [chartData] = await pool.execute(`
            SELECT DATE(date) as appointmentDate, COUNT(id) as count 
            FROM appointments 
            WHERE date >= CURDATE() - INTERVAL 6 DAY AND date <= CURDATE()
            GROUP BY DATE(date) 
            ORDER BY appointmentDate ASC;
        `);

        res.status(200).json({
            pendingCount,
            todayCount,
            totalPatients,
            chartData
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ message: 'Server error while fetching analytics.' });
    }
});

// Endpoint to create a new bill for an appointment
app.post('/api/admin/billing', async (req, res) => {
    const { appointment_id, amount, notes } = req.body;
    if (!appointment_id || !amount) {
        return res.status(400).json({ message: 'Appointment ID and amount are required.' });
    }
    try {
        await pool.execute(
            'INSERT INTO billing (appointment_id, amount, notes) VALUES (?, ?, ?)',
            [appointment_id, amount, notes || null]
        );
        res.status(201).json({ message: 'Billing record created successfully.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'A bill for this appointment already exists.' });
        }
        console.error('Error creating billing record:', error);
        res.status(500).json({ message: 'Server error while creating billing record.' });
    }
});

// Endpoint to get all billing records
app.get('/api/admin/billing', async (req, res) => {
    try {
        const [rows] = await pool.execute(`
            SELECT b.*, a.fullName, a.date 
            FROM billing b
            JOIN appointments a ON b.appointment_id = a.id
            ORDER BY b.created_at DESC
        `);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching billing records:', error);
        res.status(500).json({ message: 'Server error while fetching billing records.' });
    }
});

// Endpoint to update a bill's status (e.g., mark as 'Paid')
app.patch('/api/admin/billing/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ message: 'Status is required.' });
    }
    try {
        const [result] = await pool.execute('UPDATE billing SET status = ? WHERE id = ?', [status, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Billing record not found.' });
        }
        res.status(200).json({ message: 'Billing status updated.' });
    } catch (error) {
        console.error('Error updating billing status:', error);
        res.status(500).json({ message: 'Server error while updating billing status.' });
    }
});

// THIS IS THE SINGLE, CORRECTLY PLACED ENDPOINT FOR UPDATING APPOINTMENTS
app.patch('/api/admin/appointments/:id', async (req, res) => {
    const { id } = req.params;
    const { status, doctor_notes, medical_description } = req.body;
    let fieldsToUpdate = [];
    let queryParams = [];

    if (status) {
        fieldsToUpdate.push('status = ?');
        queryParams.push(status);
    }
    if (doctor_notes !== undefined) {
        fieldsToUpdate.push('doctor_notes = ?');
        queryParams.push(doctor_notes || null);
    }
    if (medical_description !== undefined) {
        fieldsToUpdate.push('medical_description = ?');
        queryParams.push(medical_description || null);
    }

    if (fieldsToUpdate.length === 0) {
        return res.status(400).json({ message: 'No fields to update.' });
    }

    queryParams.push(id);

    try {
        const [result] = await pool.execute(
            `UPDATE appointments SET ${fieldsToUpdate.join(', ')} WHERE id = ?`,
            queryParams
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }
        res.status(200).json({ message: `Appointment ${id} updated successfully.` });
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ message: 'Server error while updating appointment.' });
    }
});

// --- 9. Start the Server ---
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});