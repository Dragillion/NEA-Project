"use strict";

// Base URL for API endpoints
const API_BASE = "http://localhost:3000/api";

// Helper to get the JWT token from localStorage
const getToken = () => localStorage.getItem("token");

// Helper to fetch JSON and throw on error
const fetchJSON = async (url, options = {}) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  return response.json();
};

// Common add-to-cart logic (for both logged-in and guest users)
const handleAddToCart = async (productId, token) => {
  if (token) {
    await fetchJSON(`${API_BASE}/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
  } else {
    let localCart = JSON.parse(localStorage.getItem("localCart") || "[]");
    const existingItem = localCart.find(item => item.productId === productId);
    if (existingItem) {
      existingItem.quantity++;
    } else {
      localCart.push({ productId, quantity: 1 });
    }
    localStorage.setItem("localCart", JSON.stringify(localCart));
  }
  document.dispatchEvent(new CustomEvent("cartUpdated"));
};

//Merge local cart with backend cart
const mergeLocalCartWithBackend = async (token) => {
  const localCart = JSON.parse(localStorage.getItem("localCart") || "[]");
  if (localCart.length === 0) return;

  for (const item of localCart) {
    try {
      await fetchJSON(`${API_BASE}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: item.productId, quantity: item.quantity }),
      });
    } catch (error) {
      console.error("Error merging cart item:", error);
    }
  }
  localStorage.removeItem("localCart");

  // Dispatch the event so previewCart.js updates immediately
  document.dispatchEvent(new CustomEvent("cartUpdated"));
};


// Show a temporary notification message
const showNotification = (message, type = "success", duration = 1500) => {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add("show"), 10);

  if (duration !== null) {
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 500);
    }, duration);
  }
};

// Validation helpers
const validateEmail = email =>
  /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(email);
const validateName = name => name && /^[a-zA-Z\s]+$/.test(name);
const validatePhone = phone => /^07\d{9}$/.test(phone);

document.addEventListener("DOMContentLoaded", async () => {
  // Check if a token was passed via URL (from Google login)
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get("token");
  const loginMethodFromUrl = urlParams.get("loginMethod");
  if (tokenFromUrl) {
    localStorage.setItem("token", tokenFromUrl);
    if (loginMethodFromUrl) {
      localStorage.setItem("loginMethod", loginMethodFromUrl);
    }
    // Merge the local cart with the backend cart
    await mergeLocalCartWithBackend(tokenFromUrl);
    // Clean the URL by removing the query parameters
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  const accountDropdown = document.querySelector(".account-dropdown .dropdown-content");

  if (!accountDropdown) {
    console.error("Dropdown element not found!");
    return;
  }

  const updateAccountDropdown = () => {
    const token = localStorage.getItem("token");

    if (token) {
      // If logged in, show My Account and Logout
      accountDropdown.innerHTML = `
          <a href="account.html">My Account</a>
          <a href="#" id="logoutLink">Logout</a>
      `;

      // Add logout functionality
      document.getElementById("logoutLink").addEventListener("click", async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
          await fetch(`${API_BASE}/auth/logout`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (error) {
          console.error("Logout request failed:", error);
        }

        // If the user logged in via Google, also clear the Passport session
        const loginMethod = localStorage.getItem("loginMethod");
        if (loginMethod === "google") {
          try {
            await fetch(`${API_BASE}/auth/google/logout`);
          } catch (error) {
            console.error("Google logout failed:", error);
          }
          localStorage.removeItem("loginMethod");
        }

        localStorage.removeItem("token");
        window.location.href = "index.html"; // Redirect to index.html after logout
      });
    } else {
      // If logged out, show Login/Register links and the Google login link
      accountDropdown.innerHTML = `
          <a href="login.html">Login</a>
          <a href="register.html">Register</a>
          <a href="#" id="myAccountLink">My Account</a>
          <a href="http://localhost:3000/api/auth/google/">Sign in with Google</a>
      `;

      // Add event listener for My Account when logged out
      document.getElementById("myAccountLink").addEventListener("click", (e) => {
        e.preventDefault();
        showNotification("You need to log in to access your account.", "error", 2000);
      });
    }
  };

  updateAccountDropdown(); // Run on page load
});




