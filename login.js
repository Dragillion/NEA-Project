document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.querySelector('form');
    
    loginForm.addEventListener('submit', function (event) {
        // Get input values
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        let valid = true;  // Flag to track form validity
        let errorMessage = '';  // To accumulate error messages

        // Validate Email using a regular expression
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailRegex.test(email)) {
            valid = false;
            errorMessage += "Please enter a valid email address.\n";
        }

        // Validate Password (must not be empty and at least 6 characters)
        if (password === '') {
            valid = false;
            errorMessage += "Password is required.\n";
        } else if (password.length < 6) {
            valid = false;
            errorMessage += "Password must be at least 6 characters long.\n";
        }

        // If validation fails, show the error messages
        if (!valid) {
            alert(errorMessage);
            event.preventDefault();  // Prevent form submission
        }
    });
});
