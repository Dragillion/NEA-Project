document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.querySelector('form');
    
    registerForm.addEventListener('submit', function (event) {
        // Get input values
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        let valid = true;  // Flag to track form validity
        let errorMessage = '';  // To accumulate error messages

        // Validate Full Name
        if (name === '') {
            valid = false;
            errorMessage += "Full Name is required.\n";
        }

        // Validate Email using a regular expression
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(email)) {
            valid = false;
            errorMessage += "Please enter a valid email address.\n";
        }

        // Validate Password (must be at least 6 characters long)
        if (password.length < 6) {
            valid = false;
            errorMessage += "Password must be at least 6 characters long.\n";
        }

        // Validate Confirm Password (must match password)
        if (password !== confirmPassword) {
            valid = false;
            errorMessage += "Password and Confirm Password must match.\n";
        }

        // If validation fails, show the error messages
        if (!valid) {
            alert(errorMessage);  
            event.preventDefault();  // Prevent form submission
        }
    });
});
