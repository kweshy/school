document.addEventListener('DOMContentLoaded', () => {
    const table = document.querySelector('.table');
    const dateInput = document.querySelector('.controls input[type="date"]');
    const markAllBtn = document.querySelector('.controls button');
    const reportBtn = document.querySelector('.header-buttons .report');

    // Students will be loaded from database
    let students = [];

    // Load attendance data or initialize
    let attendanceData = JSON.parse(localStorage.getItem('attendanceData')) || {};

    // Fetch students from database (FULL NAME ONLY)
    async function loadStudents() {
        try {
            const res = await fetch('http://localhost:3000/api/students');
            students = await res.json(); // [{ full_name: "John Doe" }]
            generateRows(dateInput.value);
        } catch (err) {
            console.error('Failed to load students', err);
        }
    }

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

    // Generate rows dynamically
    function generateRows(date) {
        // Remove old rows
        const oldRows = table.querySelectorAll('.row');
        oldRows.forEach(r => r.remove());

        students.forEach(student => {
            const fullName = student.full_name;

            const row = document.createElement('div');
            row.className = 'row';
            row.dataset.student = fullName;
            row.dataset.studentId = student.id; 
           const status = 'Not marked';


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

            buttons[0].addEventListener('click', () => {
                statusDiv.textContent = 'Present';
                statusDiv.style.color = 'green';
            });
            buttons[1].addEventListener('click', () => {
                statusDiv.textContent = 'Absent';
                statusDiv.style.color = 'red';
            });
            buttons[2].addEventListener('click', () => {
                statusDiv.textContent = 'Late';
                statusDiv.style.color = 'orange';
            });
            buttons[3].addEventListener('click', () => {
                statusDiv.textContent = 'Excused';
                statusDiv.style.color = 'blue';
            });

            table.appendChild(row);
        });
    }

    // Save attendance for current date
    function saveAttendance(date) {
        if (!attendanceData[date]) attendanceData[date] = {};
        const rows = table.querySelectorAll('.row');
        rows.forEach(row => {
            const student = row.dataset.student;
            const status = row.querySelector('.status').textContent;
            attendanceData[date][student] = status;
        });
        localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
    }

    // Mark all present
    markAllBtn.addEventListener('click', () => {
        const rows = table.querySelectorAll('.row');
        rows.forEach(row => {
            const statusDiv = row.querySelector('.status');
            statusDiv.textContent = 'Present';
            statusDiv.style.color = 'green';
        });
    });

    // Date change
    dateInput.addEventListener('change', () => {
        generateRows(dateInput.value);
    });
   // Report button
    reportBtn.addEventListener('click', async () => {
    const selectedDate = dateInput.value;

    const rows = table.querySelectorAll('.row');
    const attendanceRecords = [];
    const reportData = {}; // <-- for localStorage report

    rows.forEach(row => {
        const studentId = row.dataset.studentId;
        const studentName = row.dataset.student;
        const status = row.querySelector('.status').textContent;

        // Only include marked statuses
        if (['Present', 'Absent', 'Late', 'Excused'].includes(status)) {
            attendanceRecords.push({ student_id: studentId, date: selectedDate, status });
        }

        // Always include in report (even Not marked)
        reportData[studentName] = status;
    });

    // Send to server
    try {
        const res = await fetch('http://localhost:3000/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ records: attendanceRecords })
        });

        const data = await res.json();
        if (data.success) {
            alert('Attendance saved to database!');
        } else {
            alert('Failed to save attendance.');
        }
    } catch (err) {
        console.error(err);
        alert('Error sending attendance to server.');
    }

    // Save report to localStorage for the report page
    localStorage.setItem('attendanceReport', JSON.stringify(reportData));
    localStorage.setItem('attendanceReportDate', selectedDate);

    // Redirect to report page
    window.location.href = 'attendance report.html';
});

    // Initial load
    loadStudents();
})
