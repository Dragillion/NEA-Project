"use strict";

document.addEventListener("DOMContentLoaded", async () => {
  const token = getToken();
  const cartPreviewContainer = document.createElement("div");
  cartPreviewContainer.id = "cart-preview";
  cartPreviewContainer.className = "cart-preview";
  document.body.appendChild(cartPreviewContainer);
  const cartIcon = document.querySelector(".cart-icon");
  const cartCountBadge = document.querySelector(".cart-count");

  const updateCartPreview = async cartItems => {
    cartPreviewContainer.innerHTML = "";

    // Calculate total item count
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // Update and show/hide cart count badge
    if (itemCount > 0) {
      cartCountBadge.textContent = itemCount;
      cartCountBadge.style.display = "inline-block";
    } else {
      cartCountBadge.style.display = "none";
    }

    if (!cartItems.length) {
      cartPreviewContainer.innerHTML = `<p class="empty-cart-message">Your cart is empty.</p>`;
      return;
    }

    let totalPrice = 0;
    const itemsHTML = await Promise.all(cartItems.map(async item => {
      try {
        // Normalize the product id to work with both local and backend cart items
        const prodId = item.productId || item.product_id;
        const product = await fetchJSON(`${API_BASE}/products/${prodId}`);
        totalPrice += product.price * item.quantity;
        return `
          <div class="cart-item">
            <img src="${product.image}" alt="${product.title}">
            <div>
              <p>${product.title}</p>
              <p>£${product.price} x ${item.quantity}</p>
            </div>
          </div>
        `;
      } catch (error) {
        console.error(error);
        return "";
      }
    }));

    cartPreviewContainer.innerHTML = itemsHTML.join("") +
      `<div class="cart-buttons">
         <a href="cart.html" class="view-cart-btn">View Cart</a>
         <a href="checkout.html" class="checkout-btn">Checkout</a>
       </div>`;
  };

  const fetchCart = async () => {
    let cart = [];
    if (token) {
      try {
        const data = await fetchJSON(`${API_BASE}/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        cart = data.products || [];
      } catch (error) {
        console.error(error);
      }
    } else {
      cart = JSON.parse(localStorage.getItem("localCart") || "[]");
    }
    await updateCartPreview(cart);
  };

  await fetchCart();

  document.addEventListener("cartUpdated", fetchCart);

  // Add hover event listeners only if the current page is not "cart.html"
  if (cartIcon && !window.location.pathname.includes("cart.html")) {
    cartIcon.addEventListener("mouseenter", () => cartPreviewContainer.style.display = "block");
    cartPreviewContainer.addEventListener("mouseenter", () => cartPreviewContainer.style.display = "block");
    cartIcon.addEventListener("mouseleave", () => {
      setTimeout(() => {
        if (!cartPreviewContainer.matches(":hover")) {
          cartPreviewContainer.style.display = "none";
        }
      }, 200);
    });
    cartPreviewContainer.addEventListener("mouseleave", () => cartPreviewContainer.style.display = "none");
  }
});
