"use strict";

document.addEventListener("DOMContentLoaded", async function () {
  // Retrieve the JWT token from localStorage
  const token = localStorage.getItem("token");

  // If no token exists, redirect to login page
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    // Fetch account details from the backend
    const response = await fetch("http://127.0.0.1:3000/api/auth/account", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    // If token is invalid or expired, remove token and redirect to login
    if (!response.ok) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return;
    }

    // Parse the returned account data
    const data = await response.json();
    const user = data.user;

    // Update the account details section with dynamic user data
    const accountDetailsSection = document.querySelector(".account-details");
    if (accountDetailsSection && user) {
      accountDetailsSection.innerHTML = `
        <h2>Account Details</h2>
        <p><strong>Name:</strong> ${user.first_name} ${user.last_name}</p>
        <p><strong>Email:</strong> ${user.email}</p>
      `;
    }
  } catch (error) {
    console.error("Error fetching account data:", error);
    // In case of any errors, redirect to the login page
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
});
