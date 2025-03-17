"use strict";

document.addEventListener("DOMContentLoaded", async () => {
  // Initialization
  const cartItemsContainer = document.querySelector(".cart-items");
  const totalPriceContainer = document.querySelector("#total-price");
  const checkoutButton = document.querySelector(".checkout");
  const token = getToken();
  let cart = [];

  // Function to Display Cart Items
  const displayCartItems = async (cartItems) => {
    if (!cartItems.length) {
      totalPriceContainer.textContent = "0.00";
      return;
    }

    let totalPrice = 0;
    const itemsHTML = await Promise.all(
      cartItems.map(async (item) => {
        try {
          // Normalize product ID for both local and backend cart items
          const prodId = item.productId || item.product_id;
          const product = await fetchJSON(`${API_BASE}/products/${prodId}`);

          totalPrice += product.price * item.quantity;

          return `
            <div class="cart-item">
              <img src="${product.image}" alt="${product.title}">
              <h3>${product.title}</h3>  
              <p class="price">$${product.price}</p>
              <p class="quantity">Quantity: ${item.quantity}</p>
              <button class="remove-item" data-id="${product.id}">Remove</button>
            </div>
          `;
        } catch (error) {
          console.error(error);
          return "";
        }
      })
    );

    cartItemsContainer.innerHTML = itemsHTML.join("");
    totalPriceContainer.textContent = totalPrice.toFixed(2);
  };

  // Fetch and Display Cart Items on Page Load
  try {
    if (token) {
      const data = await fetchJSON(`${API_BASE}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      cart = data.products || [];
    } else {
      cart = JSON.parse(localStorage.getItem("localCart") || "[]");
    }

    await displayCartItems(cart);
  } catch (error) {
    console.error(error);
    cartItemsContainer.innerHTML = '<p>Error loading cart.</p>';
  }

  // Remove Items from Cart
  cartItemsContainer.addEventListener("click", async (event) => {
    if (!event.target.classList.contains("remove-item")) return;

    const productId = parseInt(event.target.dataset.id, 10);

    if (token) {
      try {
        const response = await fetch(`${API_BASE}/cart/${productId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to remove item");

        location.reload();
      } catch (error) {
        console.error(error);
      }
    } else {
      let localCart = JSON.parse(localStorage.getItem("localCart") || "[]");
      localCart = localCart.filter((item) => item.productId !== productId);
      localStorage.setItem("localCart", JSON.stringify(localCart));
      location.reload();
    }
  });

  // Event Listener: Checkout Button
  checkoutButton.addEventListener("click", (e) => {
    if (!cart.length) {
      e.preventDefault();
      showNotification("Your cart is empty.", "error");
      return;
    }

    if (!token) {
      e.preventDefault();
      showNotification("Please log in to proceed to checkout.", "error");

      // Delay redirection so the message is visible
      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000); // 2 seconds delay

      return;
    }

    // Redirect to checkout.html if logged in
    window.location.href = "checkout.html";
  });
});
