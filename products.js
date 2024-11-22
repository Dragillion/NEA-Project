document.addEventListener('DOMContentLoaded', function () {
    const productGrid = document.querySelector('.product-grid');
    const searchInput = document.querySelector('.search-bar input');
    const sortSelect = document.getElementById('sort');  // Get the sort dropdown

    // Fetch data from FakeStoreAPI
    fetch('https://fakestoreapi.com/products')
        .then(response => response.json())  // Parse the response as JSON
        .then(data => {
            // Function to render products based on data
            const renderProducts = (products) => {
                // Clear the product grid before re-rendering
                productGrid.innerHTML = '';

                // Loop through the fetched product data
                products.forEach(product => {
                    // Create a new product item container
                    const productItem = document.createElement('div');
                    productItem.classList.add('product-item');
                    productItem.dataset.name = product.title;

                    // Set the HTML for the product item with clickable link and add to cart button
                    productItem.innerHTML = `
                        <a href="product-details.html?id=${product.id}" class="product-link">
                            <img src="${product.image}" alt="${product.title}">
                            <h3>${product.title}</h3>
                            <p class="price">$${product.price}</p>
                        </a>
                        <button class="add-to-cart" data-id="${product.id}" data-name="${product.title}" data-price="${product.price}" data-image="${product.image}">Add to Cart</button>
                    `;

                    // Append the product item to the product grid
                    productGrid.appendChild(productItem);
                });
            };

            // Initial render of all products
            renderProducts(data);

            // Handle sorting when the user selects a sorting option
            sortSelect.addEventListener('change', function () {
                const selectedSort = sortSelect.value;

                // Sort the products based on the selected option
                let sortedData = [...data]; // Make a shallow copy of the data to avoid mutating the original array

                if (selectedSort === 'price-asc') {
                    sortedData.sort((a, b) => a.price - b.price);
                } else if (selectedSort === 'price-desc') {
                    sortedData.sort((a, b) => b.price - a.price);
                } else {
                    // For 'relevance' leave the array as is 
                }

                // Render the sorted products
                renderProducts(sortedData);
            });

        })
        .catch(error => {
            console.error('Error fetching product data:', error);
        });

    // Search functionality: Filter products as the user types
    searchInput.addEventListener('input', function () {
        const searchTerm = searchInput.value.toLowerCase();  // Get the search term in lowercase
        const productItems = document.querySelectorAll('.product-item');

        // Loop through the product items and hide/show them based on the search term
        productItems.forEach(function (item) {
            const productName = item.dataset.name.toLowerCase();
            if (productName.includes(searchTerm)) {
                item.style.display = '';  // Show the product if it matches
            } else {
                item.style.display = 'none';  // Hide the product if it doesn't match
            }
        });
    });

    // Add to Cart functionality
    productGrid.addEventListener('click', function (event) {
        if (event.target.classList.contains('add-to-cart')) {
            const productId = event.target.dataset.id;
            const productName = event.target.dataset.name;
            const productPrice = event.target.dataset.price;
            const productImage = event.target.dataset.image;

            // Get the cart from localStorage (or create an empty array if not available)
            let cart = JSON.parse(localStorage.getItem('cart')) || [];

            // Check if the product is already in the cart
            const existingProduct = cart.find(item => item.id === productId);

            if (existingProduct) {
                // If the product exists, increase the quantity
                existingProduct.quantity += 1;
            } else {
                // Otherwise, add the new product to the cart
                cart.push({
                    id: productId,
                    name: productName,
                    price: productPrice,
                    image: productImage,
                    quantity: 1
                });
            }

            // Save the updated cart back to localStorage
            localStorage.setItem('cart', JSON.stringify(cart));

            alert(`${productName} has been added to the cart`);
        }
    });
});
