document.addEventListener('DOMContentLoaded', function () {
    const cartItemsContainer = document.querySelector('.cart-items');
    const totalPriceContainer = document.querySelector('#total-price');
    
    // Get the cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Display the cart items dynamically
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
    } else {
        let totalPrice = 0;
        cartItemsContainer.innerHTML = ''; // Clear the cart before displaying items
        
        cart.forEach(item => {
            totalPrice += item.price * item.quantity;

            const cartItem = document.createElement('div');
            cartItem.classList.add('cart-item');
            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <h3>${item.name}</h3>
                <p class="price">$${item.price}</p>
                <p class="quantity">Quantity: ${item.quantity}</p>
                <button class="remove-item" data-id="${item.id}">Remove</button>
            `;
            cartItemsContainer.appendChild(cartItem);
        });

        // Display total price
        totalPriceContainer.textContent = totalPrice.toFixed(2);

        // Add event listeners to remove items
        cartItemsContainer.addEventListener('click', function (event) {
            if (event.target.classList.contains('remove-item')) {
                const productId = event.target.dataset.id;
                
                // Remove the item from the cart
                const updatedCart = cart.filter(item => item.id !== productId);
                
                // Save the updated cart back to localStorage
                localStorage.setItem('cart', JSON.stringify(updatedCart));
                
                // Reload the page to update the cart display
                location.reload();
            }
        });
    }

    // Proceed to Checkout button functionality
    const proceedToCheckoutButton = document.querySelector('.checkout'); // Get the checkout button

    // Add click event listener to the button
    proceedToCheckoutButton.addEventListener('click', function (event) {
        // Check if the cart is empty
        if (cart.length === 0) {
            alert("Your cart is empty. You need to add items to your cart before proceeding to checkout.");
            event.preventDefault();  // Prevent navigation to checkout if the cart is empty
        } else {
            window.location.href = 'checkout.html'; // Redirect to checkout.html if cart is not empty
        }
    });
});
