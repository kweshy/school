const totalStudentsEl = document.getElementById("totalStudents");

// Function to fetch total students
async function fetchTotalStudents() {
    try {
        const response = await fetch("http://localhost:3000/students");
        const students = await response.json();

        // Update the card only if the number changed
        if (totalStudentsEl.textContent != students.length) {
            totalStudentsEl.textContent = students.length;
        }
    } catch (error) {
        console.error("Error fetching students:", error);
        totalStudentsEl.textContent = "Error";
    }
}

// Fetch on page load
fetchTotalStudents();

// Auto-refresh every 5 seconds (5000 ms)
setInterval(fetchTotalStudents, 5000);


function openModal() {
  document.getElementById("studentModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("studentModal").style.display = "none";
}
