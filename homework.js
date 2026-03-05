// ======================================================
// DOM REFERENCES
// ======================================================
const user = JSON.parse(localStorage.getItem("user"));
const teacherId = user.id;

const modal = document.getElementById("homeworkModal");
const newBtn = document.getElementById("newHomeworkBtn");
const closeBtn = document.getElementById("closeModal");
const createBtn = document.getElementById("createHomework");
const container = document.getElementById("homeworkContainer");

const assignModal = document.getElementById("assignModal");
const closeAssignModalBtn = document.getElementById("closeAssignModal");
const assignSelectedBtn = document.getElementById("assignSelected");
const unassignSelectedBtn = document.getElementById("unassignSelected");
const whatsappMessageInput = document.getElementById("whatsappMessage");

// ======================================================
// STATE VARIABLES
// ======================================================
let selectedHomeworkId = null;
let homeworkMap = {}; // store homework by id for easy access

// ======================================================
// CORE FUNCTIONS
// ======================================================

// Create Homework Card
function createHomeworkCard(hw) {
  homeworkMap[hw.id] = hw; // store homework for WhatsApp sending

  const emptyBox = container.querySelector('.box.center');
  if (emptyBox) emptyBox.remove();

  const dueDate = hw.due_date
    ? new Date(hw.due_date).toISOString().split("T")[0]
    : hw.dueDate || "No date";

  const card = document.createElement("div");
  card.className = "homework-card";

  card.innerHTML = `
    <h3>${hw.title}</h3>
    <p><strong>${hw.subject}</strong> • Due ${dueDate}</p>
    <p>${hw.description || ''}</p>
    <div class="card-actions">
      <button class="action-btn assign-btn">
        <i class="fa-solid fa-graduation-cap"></i> Assign
      </button>
      <button class="action-btn send-btn">
        <i class="fa-solid fa-paper-plane"></i> Send All
      </button>
      <button class="action-btn delete-btn">
        <i class="fa-solid fa-trash"></i> Delete
      </button>
    </div>
  `;

  container.appendChild(card);

  // Assign button
  card.querySelector(".assign-btn").addEventListener("click", () => {
    selectedHomeworkId = hw.id;
    assignModal.style.display = "flex";
    loadStudents(hw.id);
  });

  // Send All WhatsApp messages with homework details
card.querySelector(".send-btn").addEventListener("click", async () => {
  if (!hw.id) return alert("Homework data not found");

  const teacherMessage = whatsappMessageInput.value.trim();

  try {
    // Fetch assigned students
    const resAssigned = await fetch(`http://localhost:3000/api/homework-assigned/${hw.id}`);
    const assignedStudentIds = await resAssigned.json();

    if (assignedStudentIds.length === 0) {
      return alert("No students assigned to this homework");
    }

    // Fetch all students
    const resStudents = await fetch(`http://localhost:3000/api/students-for-homework?teacher_id=${teacherId}`);
    const allStudents = await resStudents.json();

    const selectedStudents = allStudents.filter(s => assignedStudentIds.includes(s.id));

    selectedStudents.forEach(student => {
      // Build full message with homework info + teacher text
      const homeworkInfo = `
Homework Assignment

Student: ${student.full_name}
Subject: ${hw.subject}
Title: ${hw.title}
Description: ${hw.description || ""}
Due Date: ${new Date(hw.due_date).toLocaleDateString()}
`;

      const finalMessage = teacherMessage
        ? homeworkInfo + "\n" + teacherMessage
        : homeworkInfo;

      const link = createWhatsAppLink(student.parent_phone, finalMessage);
      window.open(link, "_blank");
    });

  } catch (err) {
    console.error("Error sending WhatsApp messages:", err);
    alert("Failed to send messages");
  }
});

  // Delete button
  card.querySelector(".delete-btn").addEventListener("click", async () => {
    if (!confirm("Delete this homework?")) return;

    try {
      const res = await fetch(`http://localhost:3000/api/homework/${hw.id}`, { method: 'DELETE' });
      if (res.ok) {
        card.remove();
        delete homeworkMap[hw.id];
      } else {
        const data = await res.json();
        alert("Failed to delete: " + data.message);
      }
    } catch (err) {
      console.error("Error deleting homework:", err);
    }
  });
}

// Load all homework
async function loadHomework() {
  container.innerHTML = '';

  try {
    const res = await fetch(`http://localhost:3000/api/homework?teacherId=${teacherId}`);
    const homeworkList = await res.json();

    if (homeworkList.length === 0) {
      container.innerHTML = '<div class="box center"><p>No homework yet.</p></div>';
    } else {
      homeworkList.forEach(hw => createHomeworkCard(hw));
    }

  } catch (err) {
    console.error(err);
  }
}

// Load students for assignment modal
async function loadStudents(homeworkId) {
  const list = document.getElementById("studentList");
  list.innerHTML = "Loading...";

  try {
    const resStudents = await fetch(`http://localhost:3000/api/students-for-homework?teacher_id=${teacherId}`);
    const students = await resStudents.json();

    const resAssigned = await fetch(`http://localhost:3000/api/homework-assigned/${homeworkId}`);
    const assigned = await resAssigned.json();

    list.innerHTML = "";
    students.forEach(student => {
      const isAssigned = assigned.includes(student.id);
      const row = document.createElement("div");
      row.className = "student-row";

      row.innerHTML = `
        <label>
          <input type="checkbox"
            value="${student.id}"
            class="student-check"
            ${isAssigned ? "checked" : ""}>
          ${student.full_name} (${student.parent_phone})
          ${isAssigned ? " - Already assigned" : ""}
        </label>
      `;
      list.appendChild(row);
    });
  } catch (err) {
    console.error("Error loading students:", err);
    list.innerHTML = "<p>Failed to load students</p>";
  }
}

// Build WhatsApp message
function buildMessage(template, student, homework) {
  return template
    .replaceAll("{student}", student.full_name)
    .replaceAll("{subject}", homework.subject)
    .replaceAll("{title}", homework.title)
    .replaceAll("{description}", homework.description || "")
    .replaceAll("{due_date}", new Date(homework.due_date).toLocaleDateString());
}

// Create WhatsApp link
function createWhatsAppLink(phone, message) {
  const cleanPhone = phone.replace("+", "");
  return `https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
}

// ======================================================
// EVENT LISTENERS
// ======================================================

// Modal open/close
newBtn.addEventListener("click", () => modal.style.display = "flex");
closeBtn.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });

// Create homework
createBtn.addEventListener("click", async () => {
  const subject = document.getElementById("subject").value.trim();
  const title = document.getElementById("title").value.trim();
  const description = document.getElementById("description").value.trim();
  const dueDate = document.getElementById("dueDate").value;
  // Grab the active checkbox
  const active = document.getElementById("activeHomework").checked;
 

  if (!subject || !title || !dueDate) return alert("Fill all required fields");

  try {
    const res = await fetch('http://localhost:3000/api/homework', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, title, description, dueDate, teacher_id: teacherId, active})
    });
    const newHW = await res.json();
    createHomeworkCard(newHW);
    modal.style.display = "none";
  } catch (err) {
    console.error(err);
  }
});

// Assign students
assignSelectedBtn.addEventListener("click", async () => {
  const checked = document.querySelectorAll(".student-check:checked");
  const studentIds = [...checked].map(c => c.value);
  if (studentIds.length === 0) return alert("Select students");

  await fetch("http://localhost:3000/api/assign-homework", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ homeworkId: selectedHomeworkId, students: studentIds })
  });

  alert("Homework Assigned ✅");
  assignModal.style.display = "none";
  loadStudents(selectedHomeworkId);
});

// Unassign students
unassignSelectedBtn.addEventListener("click", async () => {
  const checked = document.querySelectorAll(".student-check:checked");
  const studentIds = [...checked].map(c => c.value);
  if (studentIds.length === 0) return alert("Select students to unassign");
  if (!selectedHomeworkId) return alert("No homework selected");

  const res = await fetch("http://localhost:3000/api/unassign-homework", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ homeworkId: selectedHomeworkId, students: studentIds })
  });

  if (res.ok) {
    alert("Students unassigned ✅");
    loadStudents(selectedHomeworkId);
  } else {
    const data = await res.json();
    alert("Failed: " + data.message);
  }
});

// Close assign modal
closeAssignModalBtn.addEventListener("click", () => assignModal.style.display = "none");

// ======================================================
// INITIAL LOAD
// ======================================================
document.addEventListener("DOMContentLoaded", loadHomework);