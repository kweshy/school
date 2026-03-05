const user = JSON.parse(localStorage.getItem("user"));
const teacherId = user.id;
const teacherGrade = user.grade_group; // dynamically get teacher's grade group
document.addEventListener('DOMContentLoaded', () => {
    

    const table = document.querySelector('.table');
    const dateInput = document.querySelector('.controls input[type="date"]');
    const markAllBtn = document.getElementById('markAllBtn');
    const reportBtn = document.querySelector('.header-buttons .report');
    const saveBtn = document.querySelector('.header-buttons .save');
    const searchInput = document.getElementById('searchStudent');
    
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("user"); // clear login
    window.location.href = "login.html"; // redirect
  });
}

  // =========================
  // Sidebar Name
  // =========================
  const nameEl = document.getElementById("sidebarUserName");
  if (user && nameEl) {
  nameEl.textContent = user.fullname || user.name || "Teacher";
}

    // Stores unsaved attendance by date
    let attendanceMemory = {};

    // Students loaded from database
    let students = [];

    // Helper function for color
    function getColor(status) {
        switch (status) {
            case 'Present': return 'green';
            case 'Absent': return 'red';
            case 'Late': return 'orange';
            case 'Excused': return 'blue';
            default: return 'black';
        }
    }

    // Update status in UI + memory only
    function updateStatus(studentId, status, statusDiv) {
        statusDiv.textContent = status;
        statusDiv.style.color = getColor(status);

        const date = dateInput.value;
        if (!attendanceMemory[date]) attendanceMemory[date] = {};
        attendanceMemory[date][studentId] = status;
    }

    // Fetch students
    async function loadStudents() {
        try {
           const res = await fetch(
`http://localhost:3000/api/students?teacher_id=${teacherId}`
);
            students = await res.json();
            await generateRows(dateInput.value);
        } catch (err) {
            console.error('Failed to load students', err);
        }
    }

    // Fetch attendance for a specific date
    async function loadAttendance(date) {
        try {
            const res = await fetch(`http://localhost:3000/api/attendance?date=${dateInput.value}&teacher_id=${teacherId}`);
            const data = await res.json();
            const attendanceByStudentId = {};

            if (data.success) {
                data.records.forEach(rec => {
                    attendanceByStudentId[rec.student_id] = rec.status;
                });
            }

            return attendanceByStudentId;
        } catch (err) {
            console.error('Failed to load attendance', err);
            return {};
        }
    }

    // Generate table rows
    async function generateRows(date) {

        const oldRows = table.querySelectorAll('.row');
        oldRows.forEach(r => r.remove());

        const attendance = await loadAttendance(date);

        students.forEach(student => {

            const fullName = student.full_name;
            const row = document.createElement('div');
            row.className = 'row';
            row.dataset.student = fullName;
            row.dataset.studentId = student.id;

            const status =
                (attendanceMemory[date] && attendanceMemory[date][student.id]) ||
                attendance[student.id] ||
                'Not marked';

            row.innerHTML = `
                <div class="student">
                    <div class="avatar">
                        ${fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                    ${fullName}
                </div>
                <div class="status" style="color:${getColor(status)}">${status}</div>
                <div class="actions">
                    <button title="Present">✓</button>
                    <button title="Absent">✕</button>
                    <button title="Late">⏰</button>
                    <button title="Excused">🛈</button>
                </div>
            `;

            const statusDiv = row.querySelector('.status');
            const buttons = row.querySelectorAll('.actions button');

            buttons[0].addEventListener('click', () =>
                updateStatus(student.id, 'Present', statusDiv)
            );
            buttons[1].addEventListener('click', () =>
                updateStatus(student.id, 'Absent', statusDiv)
            );
            buttons[2].addEventListener('click', () =>
                updateStatus(student.id, 'Late', statusDiv)
            );
            buttons[3].addEventListener('click', () =>
                updateStatus(student.id, 'Excused', statusDiv)
            );

            table.appendChild(row);
        });
    }

    // Mark all present (memory only)
    markAllBtn.addEventListener('click', () => {

        const rows = table.querySelectorAll('.row');
        const date = dateInput.value;

        if (!attendanceMemory[date]) attendanceMemory[date] = {};

        rows.forEach(row => {
            const statusDiv = row.querySelector('.status');
            const studentId = row.dataset.studentId;

            statusDiv.textContent = 'Present';
            statusDiv.style.color = getColor('Present');

            attendanceMemory[date][studentId] = 'Present';
        });
    });

    // SAVE button → Save to database
    saveBtn.addEventListener('click', async () => {

        const selectedDate = dateInput.value;
        const records = attendanceMemory[selectedDate];

        if (!records) {
            alert("No attendance marked for this date.");
            return;
        }

        const attendanceRecords = Object.keys(records).map(studentId => ({
            student_id: studentId,
            date: selectedDate,
            status: records[studentId]
        }));

        try {
            const res = await fetch('http://localhost:3000/api/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: attendanceRecords })
            });

            const data = await res.json();

            if (data.success) {
                alert('Attendance saved successfully!');
            } else {
                alert('Failed to save attendance.');
            }

        } catch (err) {
            console.error(err);
            alert('Error saving attendance.');
        }
    });

    // Report button → Only navigate
    reportBtn.addEventListener('click', () => {
        window.location.href = 'attendance report.html';
    });

    // Date change
    dateInput.addEventListener('change', () => {
        generateRows(dateInput.value);
    });

    // Search filter
    searchInput.addEventListener('keyup', () => {
        const searchValue = searchInput.value.toLowerCase();
        const rows = table.querySelectorAll('.row');

        rows.forEach(row => {
            const studentName = row.dataset.student.toLowerCase();
            row.style.display = studentName.includes(searchValue) ? '' : 'none';
        });
    });
  
     // ===== Total Students Feature =====
const totalInput = document.getElementById('totalStudentsInput');
const setTotalBtn = document.getElementById('setTotalBtn');

// Load current total students on page load
async function loadTotalStudents() {
    try {
        const res = await fetch(`http://localhost:3000/api/total-students/${encodeURIComponent(teacherGrade)}?teacher_id=${teacherId}`);
        const data = await res.json();
        totalInput.value = data.total || 0;
    } catch (err) {
        console.error('Error loading total students:', err);
    }
}


// Update total students in database when button clicked
setTotalBtn.addEventListener('click', async () => {
    const total = parseInt(totalInput.value);
    if (!total || total < 1) return alert('Enter a valid number');

    try {
        const res = await fetch('http://localhost:3000/api/set-total', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ className: teacherGrade, total, teacher_id: teacherId })
        });

        const data = await res.json();
        alert(data.message || 'Total students updated successfully!');
    } catch (err) {
        console.error('Error updating total students:', err);
        alert('Error updating total students.');
    }
});

 // Call this on page load
loadTotalStudents();

    // Initial load
    loadStudents();
});
