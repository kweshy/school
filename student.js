const API_URL = "http://localhost:3000/students";
const user = JSON.parse(localStorage.getItem("user"));
const studentsTable = document.getElementById("studentsTable");
const studentCount = document.getElementById("studentCount");
const noStudents = document.getElementById("noStudents");
const studentModal = document.getElementById("studentModal");
const modalForm = document.querySelector(".modal-form");

let editingStudentId = null; // To track editing


// ✅ Move DOM-related things inside DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {

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

});


// OPEN & CLOSE MODAL
function openModal() {
    studentModal.style.display = "flex";
}

function closeModal() {
    studentModal.style.display = "none";
    modalForm.reset();
    editingStudentId = null;
}

// FETCH STUDENTS
async function fetchStudents() {
    try {
       const res = await fetch(`${API_URL}?teacher_id=${user.id}`);
       const students = await res.json();
        renderStudents(students);
    } catch (err) {
        console.error("Error fetching students:", err);
    }
}

// RENDER STUDENTS
function renderStudents(students) {
    studentsTable.innerHTML = "";

    if (!students.length) {
        noStudents.style.display = "block";
        studentCount.textContent = "No students yet";
        return;
    } else {
        noStudents.style.display = "none";
    }

    students.forEach(student => {
        const row = document.createElement("tr");
        row.innerHTML = `
    <td>${student.full_name}</td>
    <td>${student.grade}</td>
    <td>${student.parent_name}</td>
    <td>${student.parent_phone}</td>

    <td>
        <button class="btn-edit" onclick="editStudent(${student.id})" title="Edit Student">
            <i class="fa fa-edit"></i>
        </button>
        <button class="btn-delete" onclick="deleteStudent(${student.id})" title="Delete Student">
            <i class="fa fa-trash"></i>
        </button>
    </td>
        `;
        studentsTable.appendChild(row);
    });

    studentCount.textContent = `Total Students: ${students.length}`;
}

// ADD OR UPDATE STUDENT
modalForm.addEventListener("submit", async function(e) {
    e.preventDefault();

    const formData = new FormData(modalForm);
    const studentData = {
        full_name: formData.get("full_name"),
        grade: formData.get("grade"),
        parent_name: formData.get("parent_name"),
        parent_phone: formData.get("parent_phone"),
        teacher_id: user.id
    };

    try {
        if (editingStudentId) {
            await fetch(`${API_URL}/${editingStudentId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(studentData)
            });
        } else {
            await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(studentData)
            });
        }

        closeModal();
        fetchStudents();

    } catch (err) {
        console.error("Error saving student:", err);
    }
});

// DELETE STUDENT
async function deleteStudent(id) {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
        await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        fetchStudents();
    } catch (err) {
        console.error("Error deleting student:", err);
    }
}

// EDIT STUDENT
async function editStudent(id) {
    try {
        const res = await fetch(`${API_URL}/${id}`);
        const student = await res.json();

        editingStudentId = id;
        openModal();

        modalForm.querySelector('input[placeholder="John Doe"]').value = student.full_name;
        modalForm.querySelector('input[placeholder="Grade 5"]').value = student.grade;
        modalForm.querySelector('input[placeholder="Jane Doe"]').value = student.parent_name;
        modalForm.querySelector('input[name="parent_phone"]').value = student.parent_phone;

    } catch (err) {
        console.error("Error fetching student for edit:", err);
    }
}

// INITIAL LOAD
fetchStudents();