"use strict";

document.addEventListener("DOMContentLoaded", async () => {
  const productId = new URLSearchParams(window.location.search).get("id");
  if (!productId) return;

  const productImage = document.getElementById("product-image");
  const productTitle = document.getElementById("product-title");
  const productPrice = document.getElementById("product-price");
  const productDescription = document.getElementById("product-description");
  const reviewsContainer = document.getElementById("reviews");
  const addToCartButton = document.querySelector(".add-to-cart");
  const token = getToken();
  const toggleReviewsButton = document.getElementById("toggle-reviews");
  const reviewsWrapper = document.getElementById("reviews-container");

  // Fetch product details
  try {
    const product = await fetchJSON(`${API_BASE}/products/${productId}`);
    productImage.src = product.image;
    productTitle.textContent = product.title;
    productPrice.textContent = `$${product.price}`;
    productDescription.textContent = product.description;
  } catch {
    console.error("Error fetching product details.");
  }

  // Fetch and display reviews
  async function fetchReviews() {
    try {
      const response = await fetch(`${API_BASE}/products/${productId}/reviews`);
      const reviewsData = await response.json();
      reviewsContainer.innerHTML = reviewsData.length
        ? reviewsData.map(createReviewHTML).join("")
        : `<p class="no-reviews">No reviews yet. Be the first to write one!</p>`;
    } catch {
      console.error("Error fetching reviews.");
    }
  }

  // Generate review HTML
  function createReviewHTML(review) {
    let starsHtml = "";
    for (let i = 0; i < review.rating; i++) {
      starsHtml += `<i class="fas fa-star"></i>`;
    }
    for (let i = review.rating; i < 5; i++) {
      starsHtml += `<i class="far fa-star"></i>`;
    }
    
    return `
      <div class="review">
        <div class="review-header">
          <span class="review-user">${review.user_name}</span>
          <span class="review-rating">${starsHtml}</span>
        </div>
        <div class="review-body">
          <p>${review.description}</p>
        </div>
        <div class="review-footer">
          <span class="review-date">${formatDate(review.created_at)}</span>
        </div>
      </div>
    `;
  }

  // Format date as "day month year"
  function formatDate(dateString) {
    const date = new Date(dateString);
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  }

  // Toggle reviews visibility
  toggleReviewsButton.addEventListener("click", () => {
    reviewsWrapper.classList.toggle("hidden");
    toggleReviewsButton.textContent = reviewsWrapper.classList.contains("hidden") ? "Show Reviews" : "Hide Reviews";
    if (!reviewsWrapper.classList.contains("hidden")) fetchReviews();
  });

  // Handle review submission
  if (token) {
    document.getElementById("review-form-container").style.display = "block";
    document.getElementById("review-form").addEventListener("submit", async (e) => {
      e.preventDefault();

      const rating = parseInt(document.getElementById("review-rating").value, 10);
      const description = document.getElementById("review-description").value;
      const productIdInt = parseInt(productId, 10);

      try {
        const response = await fetch(`${API_BASE}/products/${productIdInt}/reviews`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rating, description }),
        });

        if (response.ok) {
          showNotification("Review submitted successfully!");
          e.target.reset();
          fetchReviews();
        } else {
          const errorData = await response.json();
          showNotification(errorData.error || "Error submitting review", "error");
        }
      } catch {
        showNotification("Error submitting review", "error");
      }
    });
  }

  // Handle add-to-cart functionality
  addToCartButton.addEventListener("click", async () => {
    try {
      await handleAddToCart(parseInt(productId, 10), token);
      showNotification("Item added to cart!");
    } catch {
      showNotification("Error adding item to cart.", "error");
    }
  });
});

