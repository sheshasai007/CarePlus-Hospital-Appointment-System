const express = require("express");
const db = require("./config/db");
const bcrypt = require("bcryptjs");
const session = require("express-session");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
    secret: "careplus_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        maxAge: 30 * 60 * 1000
    }
}));

// Patient Registration
app.post("/register", async function(req, res) {
    const { name, email, phone, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
        "INSERT INTO patients (name, email, phone, password) VALUES (?, ?, ?, ?)",
        [name, email, phone, hashedPassword],
        function(err) {
            if (err) {
                return res.status(400).json({
                    message: "Email already registered or registration failed."
                });
            }

            res.json({ message: "Registration successful!" });
        }
    );
});

app.use(session({
    secret: "careplus_secret_key",
    resave: false,
    saveUninitialized: false
}));
// Patient Login
app.post("/login", function(req, res) {
    const { email, password } = req.body;

    db.query(
        "SELECT * FROM patients WHERE email = ?",
        [email],
        async function(err, result) {
            if (err || result.length === 0) {
                return res.status(401).json({
                    message: "Invalid email or password."
                });
            }

            const patient = result[0];
            const valid = await bcrypt.compare(
                password, patient.password
            );

            if (!valid) {
                return res.status(401).json({
                    message: "Invalid email or password."
                });
            }

            req.session.patientId = patient.patient_id;

req.session.save(function(err) {
    if (err) {
        console.log("Session save error:", err);
        return res.status(500).json({
            message: "Session save failed"
        });
    }

    console.log("Login session ID:", req.sessionID);
    console.log("Patient ID:", req.session.patientId);

    res.json({ message: "Login successful!" });
});
        }
    );
});

// Check patient session
app.get("/check-session", function(req, res) {

    console.log("Check session ID:", req.sessionID);
    console.log("Patient ID:", req.session.patientId);

    if (req.session.patientId) {
        res.json({
            loggedIn: true,
            patientId: req.session.patientId
        });
    } else {
        res.json({
            loggedIn: false
        });
    }
});
// Get all doctors from MySQL
app.get("/doctors", function(req, res) {

    db.query("SELECT * FROM doctors", function(err, result) {

        if (err) {
            return res.status(500).json({
                message: "Unable to fetch doctors"
            });
        }

        res.json(result);
    });

});
// Book appointment
app.post("/appointments", function(req, res) {

    // Check patient login
    if (!req.session.patientId) {
        return res.status(401).json({
            message: "Please login before booking an appointment."
        });
    }

    const {
        doctorId,
        date,
        time,
        reason
    } = req.body;

    if (!doctorId || !date || !time || !reason) {
        return res.status(400).json({
            message: "Please fill all appointment details."
        });
    }

    const sql = `
        INSERT INTO appointments
        (patient_id, doctor_id, appointment_date,
         appointment_time, reason)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        req.session.patientId,
        doctorId,
        date,
        time,
        reason
    ], function(err, result) {

        if (err) {
            console.log(err);

            return res.status(500).json({
                message: "Appointment booking failed."
            });
        }

        res.json({
            message: "Appointment booked successfully!",
            appointmentId: result.insertId
        });
    });
});
app.get('/appointments', (req, res) => {
    db.query(
        `SELECT appointments.*,
        patients.name AS patient_name,
        doctors.name AS doctor_name
        FROM appointments
        JOIN patients
        ON appointments.patient_id = patients.patient_id
        JOIN doctors
        ON appointments.doctor_id = doctors.doctor_id`,
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result);
        }
    );
});
app.put('/appointments/:id', (req, res) => {
    const { status } = req.body;
    const id = req.params.id;

    db.query(
        'UPDATE appointments SET status=? WHERE appointment_id=?',
        [status, id],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Status updated successfully" });
        }
    );
});
app.delete('/appointments/:id', (req, res) => {
    db.query(
        'DELETE FROM appointments WHERE appointment_id=?',
        [req.params.id],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({message: "Appointment deleted"});
        }
    );
});
// Get logged-in patient's appointments
app.get("/my-appointments", function(req, res) {

    if (!req.session.patientId) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    const sql = `
        SELECT a.*, d.name AS doctor_name,
        d.specialization
        FROM appointments a
        JOIN doctors d ON a.doctor_id = d.doctor_id
        WHERE a.patient_id = ?
        ORDER BY a.appointment_date DESC
    `;

    db.query(sql, [req.session.patientId], function(err, result) {

        if (err) {
            return res.status(500).json({
                message: "Unable to fetch appointments."
            });
        }

        res.json(result);
    });
});

// Cancel appointment
app.put("/cancel-appointment/:id", function(req, res) {

    if (!req.session.patientId) {
        return res.status(401).json({
            message: "Please login first."
        });
    }

    const sql = `
        UPDATE appointments
        SET status = 'Cancelled'
        WHERE appointment_id = ? AND patient_id = ?
        AND status = 'Booked'
    `;

    db.query(sql, [
        req.params.id,
        req.session.patientId
    ], function(err, result) {

        if (err) {
            return res.status(500).json({
                message: "Cancellation failed."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Appointment not found or already cancelled."
            });
        }

        res.json({
            message: "Appointment cancelled successfully!"
        });
    });
});
// Start server
app.listen(3000, function() {
    console.log("CarePlus server running on port 3000");
});
// Patient Logout
app.get("/logout", function(req, res) {

    req.session.destroy(function(err) {
        if (err) {
            return res.status(500).send("Logout failed");
        }

        res.json({ message: "Logged out successfully!" });
    });

});