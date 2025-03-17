"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.querySelector("#register-form");

  // Pre-fill email if coming from login
  const emailFromLogin = new URLSearchParams(window.location.search).get("email");
  if (emailFromLogin) {
    document.getElementById("email").value = emailFromLogin;
  }

  registerForm.addEventListener("submit", async event => {
    event.preventDefault();

    const firstName = document.getElementById("first-name").value.trim();
    const lastName = document.getElementById("last-name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
    const phone = document.getElementById("phone").value.trim();

    // Collect errors in an array
    const errors = [];
    if (!validateName(firstName)) errors.push("First Name must only contain letters and spaces.");
    if (!validateName(lastName)) errors.push("Last Name must only contain letters and spaces.");
    if (!validateEmail(email)) errors.push("Please enter a valid email address.");
    if (password.length < 6) errors.push("Password must be at least 6 characters long.");
    if (password !== confirmPassword) errors.push("Password and Confirm Password must match.");
    if (phone && !validatePhone(phone)) errors.push("Phone number must be a valid UK number.");


    if (errors.length) {
      alert(errors.join("\n"));
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          password,
          phone,
        }),
      });
      const data = await response.json();
      alert(response.ok ? "Registration successful!" : (data.error || "Registration failed. Please try again."));
    } catch (error) {
      console.error("Error during registration:", error);
      alert("An error occurred while registering. Please try again.");
    }
  });
});
