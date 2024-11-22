document.addEventListener('DOMContentLoaded', function () {
    const checkoutForm = document.getElementById('checkout-form');  // Get the checkout form
    checkoutForm.addEventListener('submit', function (event) {
        // Get input values
        const name = document.getElementById('name').value.trim();
        const address = document.getElementById('address').value.trim();
        const payment = document.getElementById('payment').value;

        let valid = true;  // Flag to track form validity
        let errorMessage = '';  // To accumulate error messages

        // Validate Name (should be at least 3 characters)
        if (name.length < 3) {
            valid = false;
            errorMessage += "Name must be at least 3 characters long.\n";
        }

        // Validate Address (should not be empty)
        if (address === '') {
            valid = false;
            errorMessage += "Address is required.\n";
        }

        // Validate Payment Method (should not be empty)
        if (!payment) {
            valid = false;
            errorMessage += "Please select a payment method.\n";
        }

        // If validation fails, show the error messages
        if (!valid) {
            alert(errorMessage); 
            event.preventDefault();  // Prevent form submission
        }
    });
});
