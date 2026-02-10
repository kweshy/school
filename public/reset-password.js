const params = new URLSearchParams(window.location.search);
const token = params.get("token");

document.getElementById("resetForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const message = document.getElementById("message");

  if (password !== confirmPassword) {
    message.textContent = "Passwords do not match";
    message.style.color = "red";
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ token, password })
    });

    const data = await response.json();
    message.textContent = data.message;
    message.style.color = "green";
  } catch (error) {
    message.textContent = "Reset failed";
    message.style.color = "red";
  }
});
// Redirect to login page when Back to Login is clicked
document.getElementById('backToLogin').addEventListener('click', () => {
  window.location.href = 'login.html'; // change this to your login page
});
