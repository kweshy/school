const form = document.getElementById("reset-request-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;

  try {
    const response = await fetch("http://localhost:3000/api/request-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (data.success) {
      alert("Reset link sent! Check your email.");
    } else {
      alert("Error: " + data.message);
    }

  } catch (err) {
    console.error(err);
    alert("Server error. Try again later.");
  }
});
