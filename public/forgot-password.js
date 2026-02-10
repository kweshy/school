document.getElementById("forgotForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const message = document.getElementById("message");

  try {
    const response = await fetch("http://localhost:3000/api/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    message.textContent = data.message;
  } catch (error) {
    message.textContent = "Error sending reset link";
    message.style.color = "red";
  }
});
