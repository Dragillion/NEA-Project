"use strict";

document.addEventListener("DOMContentLoaded", async () => {
  const productGrid = document.querySelector(".product-grid");
  const searchInput = document.querySelector(".search-bar input");
  const sortSelect = document.getElementById("sort");
  const token = getToken();
  let allProducts = [];

  const fetchProducts = async () => {
    try {
      allProducts = await fetchJSON(`${API_BASE}/products`);
      renderProducts(allProducts);
    } catch (error) {
      console.error("Error fetching product data:", error);
    }
  };

  const renderProducts = products => {
    productGrid.innerHTML = "";
    products.forEach(product => {
      const productItem = document.createElement("div");
      productItem.className = "product-item";
      productItem.dataset.name = product.title.toLowerCase();
      productItem.innerHTML = `
        <a href="product-details.html?id=${product.id}" class="product-link">
          <img src="${product.image}" alt="${product.title}">
          <h3>${product.title}</h3>
          <p class="price">$${product.price}</p>
        </a>
        <button class="add-to-cart" 
          data-id="${product.id}" 
          data-name="${product.title}" 
          data-price="${product.price}" 
          data-image="${product.image}">
          Add to Cart
        </button>
      `;
      productGrid.appendChild(productItem);
    });
  };

  // Sorting functionality
  sortSelect.addEventListener("change", () => {
    const sortedProducts = [...allProducts];
    if (sortSelect.value === "price-asc") {
      sortedProducts.sort((a, b) => a.price - b.price);
    } else if (sortSelect.value === "price-desc") {
      sortedProducts.sort((a, b) => b.price - a.price);
    }
    renderProducts(sortedProducts);
  });

  // Search filter
  searchInput.addEventListener("input", () => {
    const searchTerm = searchInput.value.toLowerCase();
    document.querySelectorAll(".product-item").forEach(item => {
      item.style.display = item.dataset.name.includes(searchTerm) ? "" : "none";
    });
  });

  // Add-to-cart event
  productGrid.addEventListener("click", async event => {
    if (event.target.classList.contains("add-to-cart")) {
      const productId = parseInt(event.target.dataset.id, 10);
      try {
        await handleAddToCart(productId, token);
        showNotification("Item added to cart!");
      } catch (error) {
        console.error("Error adding product to cart:", error);
        showNotification("Error adding item to cart.", "error");
      }
    }
  });

  await fetchProducts();
});
