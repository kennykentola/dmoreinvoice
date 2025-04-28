function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    // Hardcoded credentials for simplicity
    const validUsername = 'ademola';
    const validPassword = 'ademola23';

    if (username === validUsername && password === validPassword) {
        // Store login state in localStorage
        localStorage.setItem('isLoggedIn', 'true');
        // Redirect to the invoice generator page
        window.location.href = '/invoice.html';
    } else {
        errorMessage.style.display = 'block';
    }
}

// Load theme from localStorage or default to light
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
}

window.onload = function() {
    loadTheme();
};