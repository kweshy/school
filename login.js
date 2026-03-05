// login.js

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("Email").value.trim();
  const password = document.getElementById("password").value;

  try {
    // 1️⃣ Send login request to backend
    const res = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.status !== 200) {
      alert(data.message || "Login failed!");
      return;
    }

    // 2️⃣ Store user info in localStorage
    localStorage.setItem("user", JSON.stringify(data.user));

    // 3️⃣ Redirect based on role
    if (data.user.role === "Admin") {
  window.location.href = "admin-dashboard.html";

} else if (data.user.role === "Teacher") {
  window.location.href = "dashboard.html";
}
 else {
      alert("Unknown role! Contact system admin.");
    }

  } catch (err) {
    console.error("Login error:", err);
    alert("Server error. Try again later.");
  }
});
