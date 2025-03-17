"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const nextButton = document.getElementById("nextButton");
  const passwordDiv = document.getElementById("passwordDiv");
  const logoutButton = document.getElementById("logoutButton");
  const loginSection = document.getElementById("loginSection");
  const logoutSection = document.getElementById("logoutSection");
  const userGreeting = document.getElementById("userGreeting");
  const notification = document.getElementById("notification");

  // Helper to show messages
  const showMessage = (message, type = "error") => {
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = "block";
  };

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();

    // Step 1: Email exists check
    if (passwordDiv.style.display === "none") {
      if (!validateEmail(email)) {
        showMessage("Please enter a valid email address.");
        return;
      }
      try {
        const data = await fetchJSON(`${API_BASE}/auth/check-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (data.exists) {
          passwordDiv.style.display = "block";
          nextButton.textContent = "Login";
          document.getElementById("password").focus();
        } else {
          window.location.href = `register.html?email=${encodeURIComponent(email)}`;
        }
      } catch (error) {
        console.error("Error checking email:", error);
        showMessage("An error occurred while checking email. Please try again.");
      }
    } 
    // Step 2: Login with password
    else {
      const password = document.getElementById("password").value;
      if (password.length < 6) {
        showMessage("Password must be at least 6 characters long.");
        return;
      }
      try {
        const data = await fetchJSON(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        localStorage.setItem("token", data.token);
        showNotification("Login successful! Redirecting...", "success", 3000);

        await mergeLocalCartWithBackend(data.token);
        setTimeout(() => {
          const params = new URLSearchParams(window.location.search);
          const redirectUrl = params.get("redirect") || "index.html";
          window.location.href = redirectUrl;
        }, 1000);
      } catch (error) {
        console.error("Error during login:", error);
        showMessage("Login failed", "error");
      }
    }
  });

  // Update UI based on login status
  const updateUI = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await fetchJSON(`${API_BASE}/auth/account`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      userGreeting.innerText = `Welcome, ${data.user.first_name}!`;
      loginSection.style.display = "none";
      logoutSection.style.display = "block";

    } catch {
      localStorage.removeItem("token");
    }
  };

  updateUI();
});
