const user = JSON.parse(localStorage.getItem("user"));
const teacherId = user.id; // get the logged-in teacher's ID

document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.querySelector("tbody");
  const searchInput = document.querySelector('.search');

  // Fetch and display students
  fetch(`http://localhost:3000/students?teacher_id=${teacherId}`)
    .then(res => res.json())
    .then(data => {
      tbody.innerHTML = ""; // clear any existing rows

      if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="empty">No students yet.</td></tr>`;
        return;
      }

      data.forEach(student => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${student.full_name}</td>
          <td>${student.parent_name}</td>
          <td>${student.parent_phone}</td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => {
      console.error("Error fetching students:", err);
      tbody.innerHTML = `<tr><td colspan="3" class="empty">Failed to load students.</td></tr>`;
    });

  // Search/filter functionality
  searchInput.addEventListener('keyup', () => {
    const filter = searchInput.value.toLowerCase();
    const rows = tbody.querySelectorAll('tr');

    rows.forEach(row => {
      if (row.classList.contains('empty')) return; // skip empty row
      const name = row.cells[0].textContent.toLowerCase();
      const parentName = row.cells[1].textContent.toLowerCase();
      const phone = row.cells[2].textContent.toLowerCase();

      row.style.display = (name.includes(filter) || parentName.includes(filter) || phone.includes(filter)) 
        ? '' 
        : 'none';
    });
  });
});
