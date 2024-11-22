document.addEventListener('DOMContentLoaded', function () {
    const productId = new URLSearchParams(window.location.search).get('id'); // Get product ID from URL
    const productImage = document.getElementById('product-image');
    const productTitle = document.getElementById('product-title');
    const productPrice = document.getElementById('product-price');
    const productDescription = document.getElementById('product-description');
    const addToCartButton = document.querySelector('.add-to-cart');

    // Debugging: Ensure the elements exist before continuing
    // console.log('Product Image:', productImage);
    // console.log('Product Title:', productTitle);
    // console.log('Add to Cart Button:', addToCartButton);

    if (!productImage || !productTitle || !addToCartButton) {
        console.error('One or more elements are missing on the page.');
        return; // Exit the function if needed elements are missing
    }

    // console.log('Product ID:', productId);  // Debugging: Log product ID

    // Fetch the product data from FakeStoreAPI using the product ID
    fetch(`https://fakestoreapi.com/products/${productId}`)
        .then(response => response.json())
        .then(product => {
            // console.log('Product fetched:', product);  // Debugging: Log the product data

            // Update the HTML with the product data
            productImage.src = product.image;
            productTitle.textContent = product.title;
            productPrice.textContent = `$${product.price}`;
            productDescription.textContent = product.description;

            // Add event listener to the "Add to Cart" button
            addToCartButton.addEventListener('click', function () {
                // Get the cart from localStorage (or create an empty array if not available)
                let cart = JSON.parse(localStorage.getItem('cart')) || [];

                // Check if the product is already in the cart
                const existingProduct = cart.find(item => item.id === product.id.toString());  // Ensure both IDs are strings

                if (existingProduct) {
                    // If the product exists, increase the quantity
                    existingProduct.quantity += 1;
                } else {
                    // Otherwise, add the new product to the cart
                    cart.push({
                        id: product.id.toString(),
                        name: product.title,
                        price: product.price,
                        image: product.image,
                        quantity: 1
                    });
                }

                // Save the updated cart back to localStorage
                localStorage.setItem('cart', JSON.stringify(cart));

                alert(`${product.title} has been added to the cart`);
            });
        })
        .catch(error => {
            console.error('Error fetching product details:', error);
        });
});
