document.addEventListener("DOMContentLoaded", async () => {
  const roleSelect = document.getElementById("role");
  const gradeGroupContainer = document.getElementById("gradeGroupContainer");

  // 1️⃣ Check if Admin exists and remove the option if yes
  try {
    const res = await fetch("http://localhost:3000/api/check-admin");
    const data = await res.json();
    if (data.adminExists) {
      const adminOption = roleSelect.querySelector('option[value="Admin"]');
      if (adminOption) adminOption.remove();
    }
  } catch (err) {
    console.error("Failed to check admin:", err);
  }

  // 2️⃣ Hide/show grade group based on role
  roleSelect.addEventListener("change", () => {
    if (roleSelect.value === "Admin") {
      gradeGroupContainer.style.display = "none"; // hide grade group
      document.getElementById("grade-group").value = ""; // reset value
    } else {
      gradeGroupContainer.style.display = "block"; // show grade group
    }
  });
});

document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Form values
  const fullname = document.getElementById("fullname").value.trim();
  const role = document.getElementById("role").value;
  const grade_group = document.getElementById("grade-group").value;
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // 1️⃣ Password match check
  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  // 2️⃣ Ensure teachers select a grade group
  if (role === "Teacher" && grade_group === "") {
    alert("Please select your grade group!");
    return;
  }

  // 3️⃣ Send verification code to email
  try {
    const verifyRes = await fetch("http://localhost:3000/api/send-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      alert("Failed to send verification email. Try again.");
      return;
    }

    const code = prompt("Enter the verification code sent to your email:");
    if (!code || code !== verifyData.code) {
      alert("Incorrect verification code!");
      return;
    }

    // 4️⃣ Prepare payload
    const payload = { fullname, role, email, password };
    if (role === "Teacher") payload.grade_group = grade_group; // send grade group only for teachers

    // 5️⃣ Send registration request
    const registerRes = await fetch("http://localhost:3000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const registerData = await registerRes.json();
    if (registerData.message) {
      alert(registerData.message);
      if (registerData.message === "Registration successful") {
        window.location.href = "login.html";
      }
    }

  } catch (err) {
    console.error("Registration error:", err);
    alert("Something went wrong. Try again.");
  }
});
