async function login() {
    const messages = document.getElementById('message');
    const loginBtn = document.getElementById('login-btn');
    
    const credential_1 = document.getElementById('username');
    const username = credential_1.value.trim();
    const credential_2 = document.getElementById('password');
    const password = credential_2.value;

    // Clear previous messages
    messages.className = '';
    messages.innerHTML = '';

    // Basic validation
    if (username === "" || password === "") {
        showMessage("Please fill in all fields", "error");
        return;
    }

    // Show loading state
    loginBtn.disabled = true;
    loginBtn.classList.add('loading');
    showMessage("Logging in...", "info");

    try {
        const response = await fetch('/login-account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: username, password: password })
        });

        const data = await response.json();
        
        if (response.ok && data.reply === "Login Successful") {
            showMessage(data.reply, "success");
            // Clear form on success
            credential_1.value = '';
            credential_2.value = '';
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = '/home-page';
            }, 1000);
        } else {
            showMessage(data.reply || "Login failed", "error");
            // Clear form on error
            credential_1.value = '';
            credential_2.value = '';
        }
        
    } catch (error) {
        console.error('Error:', error);
        showMessage("Network error. Please try again.", "error");
        // Clear form on network error
        credential_1.value = '';
        credential_2.value = '';
    } finally {
        // Remove loading state
        loginBtn.disabled = false;
        loginBtn.classList.remove('loading');
    }
}

function showMessage(message, type) {
    const messages = document.getElementById('message');
    messages.innerHTML = message;
    messages.className = type;
}

// Add Enter key support
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                login();
            }
        });
    });
});