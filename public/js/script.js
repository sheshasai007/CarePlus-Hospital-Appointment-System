
function toggleMenu() {
    document.getElementById("nav").classList.toggle("show");
}

function searchDoctor() {
    let value = document.getElementById("specialization").value;

    if (value === "") {
        alert("Please select a specialization");
    } else {
        window.location.href =
            "doctors.html?specialization=" +
            encodeURIComponent(value);
    }
}

let yearElement = document.getElementById("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

// Patient Registration
async function registerPatient(event) {
    event.preventDefault();

    let password = document.getElementById("password").value;
    let confirm = document.getElementById("confirmPassword").value;

    if (password !== confirm) {
        alert("Passwords do not match!");
        return;
    }

    let data = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        password: password
    };

    let response = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    let result = await response.json();
    alert(result.message);
}

// Patient Login
async function loginPatient(event) {
    event.preventDefault();

    let data = {
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
    };

    let response = await fetch("/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data)
    });

    let result = await response.json();

    alert(result.message);

    if (response.ok) {
        window.location.href = "index.html";
    }
}
// Load doctors from MySQL
// Store doctors
let allDoctors = [];

// Load doctors from MySQL
async function loadDoctors() {
    const list = document.getElementById("doctorList");

    if (!list) {
        console.log("Doctor list element not found");
        return;
    }

    try {
        const response = await fetch("/doctors");

        if (!response.ok) {
            throw new Error("Failed to fetch doctors");
        }

        allDoctors = await response.json();

        console.log("Doctors received:", allDoctors);

        list.innerHTML = "";

        if (allDoctors.length === 0) {
            list.textContent = "No doctors available.";
            return;
        }

        allDoctors.forEach(function(d) {
            const card = document.createElement("div");
            card.className = "doctor-card";
            card.dataset.special = d.specialization;

            card.innerHTML = `
                <h3>${d.name}</h3>
                <p>${d.specialization}</p>
                <p>Experience: ${d.experience} years</p>
                <p>Fee: ₹${d.fee}</p>
                <a href="appointment.html?doctorId=${d.doctor_id}">
                    Book Appointment
                </a>
            `;

            list.appendChild(card);
        });

        filterDoctors();

    } catch (error) {
        console.error("Doctor loading error:", error);
        list.textContent = "Unable to load doctors. Please try again.";
    }
}

// Search and filter
function filterDoctors() {
    const search = document.getElementById("doctorSearch").value.toLowerCase();
    const filter = document.getElementById("doctorFilter").value.toLowerCase();

    document.querySelectorAll(".doctor-card").forEach(function(card) {
        const name = card.querySelector("h3").textContent.toLowerCase();
        const specialization = card.dataset.special.toLowerCase();

        card.hidden = !(
            (name.includes(search) || specialization.includes(search)) &&
            (filter === "" || specialization === filter)
        );
    });
}

// Start loading after page is ready
document.addEventListener("DOMContentLoaded", function() {
    if (document.getElementById("doctorList")) {
        loadDoctors();
    }
});

// Load doctor details on doctor page
if (document.getElementById("doctorList")) {
    loadDoctors();
}

// Read specialization selected on homepage
if (window.location.pathname.endsWith("doctors.html")) {
    let params = new URLSearchParams(window.location.search);
    let specialization = params.get("specialization");

    if (specialization) {
        document.getElementById("doctorFilter").value = specialization;
        filterDoctors();
    }
}
// Set minimum appointment date to today
let dateInput = document.getElementById("appointmentDate");

if (dateInput) {
    let today = new Date();
    let date = today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0") + "-" +
        String(today.getDate()).padStart(2, "0");

    dateInput.min = date;

    // Get doctor name from the URL
    let params = new URLSearchParams(window.location.search);
    let doctor = params.get("doctor");

    if (doctor) {
        document.getElementById("doctorName").value = doctor;
    }
}

// Book appointment
// Book appointment in MySQL
async function bookAppointment(event) {
    event.preventDefault();

    const data = {
        doctorId: document.getElementById("doctorName").value,
        date: document.getElementById("appointmentDate").value,
        time: document.getElementById("appointmentTime").value,
        reason: document.getElementById("reason").value
    };

    try {
        const response = await fetch("/appointments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        alert(result.message);

        if (response.ok) {
            event.target.reset();
        }

    } catch (error) {
        console.log(error);
        alert("Unable to connect to the server.");
    }
}
// Display appointments
// Display appointments from MySQL
async function showAppointments() {
    let list = document.getElementById("appointmentList");

    if (!list) return;

    try {
        let response = await fetch("/my-appointments");
        let appointments = await response.json();

        if (!response.ok) {
            list.textContent = appointments.message;
            return;
        }

        list.innerHTML = "";

        if (appointments.length === 0) {
            list.textContent = "No appointments found.";
            return;
        }

        appointments.forEach(function(a) {
            let item = document.createElement("div");
            item.className = "appointment-item";

            let details = document.createElement("p");
            details.textContent =
                "Doctor: " + a.doctor_name +
                " | Specialization: " + a.specialization +
                " | Date: " + a.appointment_date +
                " | Time: " + a.appointment_time +
                " | Reason: " + a.reason +
                " | Status: " + a.status;

            item.appendChild(details);

            if (a.status === "Booked") {
                let button = document.createElement("button");
                button.textContent = "Cancel Appointment";
                button.className = "cancel-btn";
                button.onclick = function() {
                    cancelAppointment(a.appointment_id);
                };

                item.appendChild(button);
            }

            list.appendChild(item);
        });

    } catch (error) {
        list.textContent = "Unable to load appointments.";
        console.log(error);
    }
}
function loadAppointments() {
    fetch('/appointments')
    .then(res => res.json())
    .then(data => {
        let rows = "";

        data.forEach(a => {
            rows += `<tr>
                <td>${a.patient_name}</td>
                <td>${a.doctor_name}</td>
                <td>${a.appointment_date.substring(0,10)}</td>
                <td>${a.appointment_time}</td>
                <td>${a.reason}</td>
                <td>
                    <select id="status${a.appointment_id}">
                        <option>Booked</option>
                        <option>Completed</option>
                        <option>Cancelled</option>
                    </select>
                </td>
                <td>
                    <button onclick="updateStatus(${a.appointment_id})">
                        Update
                    </button>
                </td>
            </tr>`;

        });

        document.getElementById("appointmentList").innerHTML = rows;

        data.forEach(a => {
            document.getElementById("status" + a.appointment_id).value = a.status;
            document.getElementById("total").innerText = data.length;

document.getElementById("booked").innerText =
    data.filter(a => a.status === "Booked").length;

document.getElementById("completed").innerText =
    data.filter(a => a.status === "Completed").length;

document.getElementById("cancelled").innerText =
    data.filter(a => a.status === "Cancelled").length;
        });
    });
}

function updateStatus(id) {
    let status = document.getElementById("status" + id).value;

    fetch('/appointments/' + id, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({status: status})
    })
    .then(res => res.json())
    .then(() => {
        alert("Appointment status updated!");
        loadAppointments();
    });
}

loadAppointments();

// Cancel appointment in MySQL
async function cancelAppointment(id) {
    if (!confirm("Are you sure you want to cancel?")) return;

    let response = await fetch("/cancel-appointment/" + id, {
        method: "PUT"
    });

    let result = await response.json();

    alert(result.message);

    if (response.ok) {
        showAppointments();
    }
}

showAppointments();
// Display all appointments in admin dashboard
function showAdminAppointments() {
    let list = document.getElementById("adminAppointments");

    if (!list) return;

    let appointments =
        JSON.parse(localStorage.getItem("appointments")) || [];

    list.innerHTML = "";

    if (appointments.length === 0) {
        list.innerHTML = "<p>No appointments available.</p>";
        return;
    }

    appointments.forEach(function(a, index) {
        list.innerHTML += `
            <div class="admin-item">
                <h3>Appointment ${index + 1}</h3>
                <p>Patient: ${a.name}</p>
                <p>Email: ${a.email}</p>
                <p>Phone: ${a.phone}</p>
                <p>Doctor: ${a.doctor}</p>
                <p>Date: ${a.date}</p>
                <p>Time: ${a.time}</p>
                <p>Reason: ${a.reason}</p>

                <button class="delete-btn"
                    onclick="deleteAdminAppointment(${index})">
                    Delete
                </button>
            </div>
        `;
    });
}

// Delete appointment from admin dashboard
function deleteAdminAppointment(index) {
    let appointments =
        JSON.parse(localStorage.getItem("appointments")) || [];

    appointments.splice(index, 1);

    localStorage.setItem("appointments",
                         JSON.stringify(appointments));

    showAdminAppointments();
}

showAdminAppointments();
// Load doctors in appointment form
async function loadAppointmentDoctors() {
    let select = document.getElementById("doctorName");

    if (!select) return;

    let response = await fetch("/doctors");
    let doctors = await response.json();

    select.innerHTML = '<option value="">Choose a doctor</option>';

    doctors.forEach(function(d) {
        let option = document.createElement("option");
        option.value = d.doctor_id;
        option.textContent = d.name + " - " + d.specialization;
        select.appendChild(option);
    });

    let params = new URLSearchParams(window.location.search);
    let doctorId = params.get("doctorId");

    if (doctorId) {
        select.value = doctorId;
    }
}

loadAppointmentDoctors();