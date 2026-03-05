document.addEventListener("DOMContentLoaded", () => {

  const user = JSON.parse(localStorage.getItem("user"));

  // 🔐 Security check
  if (!user || user.role !== "Teacher") {
      window.location.href = "login.html";
      return;
  }
  const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("user"); // clear login
    window.location.href = "login.html"; // redirect
  });
}
// Call the function
updateActiveHomework();

  // =========================
  // Sidebar Name
  // =========================
  const nameEl = document.getElementById("sidebarUserName");
  if (user && nameEl) {
  nameEl.textContent = user.fullname || user.name || "Teacher";
}

  // =========================
  // Greeting
  // =========================
  const greetingEl = document.getElementById("greeting");
  if (greetingEl && user.name) {
      greetingEl.textContent = `Good Morning, ${user.name}! 👋`;
  }

  // =========================
  // Fetch Total Students
  // =========================
  const totalStudentsEl = document.getElementById("totalStudents");

  async function fetchTotalStudents() {
      try {
          const response = await fetch(
              `http://localhost:3000/students?teacher_id=${user.id}`
          );
          const students = await response.json();

          if (totalStudentsEl) {
              totalStudentsEl.textContent = students.length;
          }

      } catch (error) {
          console.error("Error fetching students:", error);
          if (totalStudentsEl) {
              totalStudentsEl.textContent = "Error";
          }
      }
  }

  fetchTotalStudents();
  setInterval(fetchTotalStudents, 5000);

  // =========================
  // Present Today
  // =========================
  async function updatePresentToday(date = null) {

      const selectedDate = date || new Date().toISOString().split('T')[0];

      try {
          const res = await fetch(
              `http://localhost:3000/api/attendance-summary?date=${selectedDate}&teacher_id=${user.id}`
          );

          const data = await res.json();

          if (res.ok && data.present !== undefined) {
              document.getElementById('presentToday').textContent = data.present;
          } else {
              document.getElementById('presentToday').textContent = '0';
          }

      } catch (err) {
          console.error('Error fetching present count:', err);
          document.getElementById('presentToday').textContent = '0';
      }
  }

  updatePresentToday();

});
// update event card 
async function updateActiveHomework() {
  const user = JSON.parse(localStorage.getItem("user"));
  try {
    const res = await fetch(`http://localhost:3000/api/dashboard/homework?teacherId=${user.id}`);
    const data = await res.json();

    const activeHomeworkEl = document.getElementById("activeHomeworkCount");
    if (activeHomeworkEl) {
      activeHomeworkEl.textContent = data.activeHomeworkCount;
      const span = activeHomeworkEl.nextElementSibling;
      if (span) span.textContent =
        data.activeHomeworkCount === 1 ? "Active Homework" : "Active Homeworks";
    }

  } catch (err) {
    console.error("Error updating active homework:", err);
    const activeHomeworkEl = document.getElementById("activeHomeworkCount");
    if (activeHomeworkEl) activeHomeworkEl.textContent = "0";
  }
}
const user = JSON.parse(localStorage.getItem("user"));
const teacherId = user?.id; // get logged-in teacher ID

async function updateUpcomingEventsCard() {
  const res = await fetch(`http://localhost:3000/events?teacherId=${teacherId}`);
  const events = await res.json();

  const upcomingCountEl = document.getElementById("upcomingEventCount");
  if (!upcomingCountEl) return;

  const today = new Date();
  const upcomingEvents = events.filter(e => new Date(e.event_date) >= today);

  // Update number only
  upcomingCountEl.textContent = upcomingEvents.length;
}

// Call it when page loads
updateUpcomingEventsCard();