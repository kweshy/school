// attendance.js
const user = JSON.parse(localStorage.getItem("user"));

if (!user || user.role !== "Teacher") {
    window.location.href = "login.html"; // redirect if not teacher
}

// Function to fetch and display attendance summary
async function loadAttendanceSummary() {
  const dateInput = document.getElementById("attendanceDate");
  const date = dateInput ? dateInput.value : null;

  try {
    // Use teacher_id instead of className
    let url = `http://localhost:3000/api/attendance-summary?teacher_id=${user.id}`;
    if (date) url += `&date=${date}`;

    const response = await fetch(url);
    const data = await response.json();

    document.getElementById("attendanceRate").textContent = data.attendanceRate + "%";
    document.getElementById("presentCount").textContent = data.present;
    document.getElementById("absentCount").textContent = data.absent;
    document.getElementById("lateCount").textContent = data.late;
  } catch (err) {
    console.error("Error fetching attendance:", err);
    // set defaults so UI doesn't show undefined
    document.getElementById("attendanceRate").textContent = "0%";
    document.getElementById("presentCount").textContent = "0";
    document.getElementById("absentCount").textContent = "0";
    document.getElementById("lateCount").textContent = "0";
  }
}


// Set up date picker listener
function setupDatePicker() {
  const dateInput = document.getElementById("attendanceDate");
  if (dateInput) {
    dateInput.addEventListener("change", () => {
      loadAttendanceSummary(); // no need to pass date here
    });
  }
}

// Run on page load
window.onload = () => {
  loadAttendanceSummary();
  setupDatePicker();
};
