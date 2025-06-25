async function create() {
    const messages = document.getElementById('message');
    const createBtn = document.getElementById('login-btn');
    
    const credential_1 = document.getElementById('username');
    const username = credential_1.value.trim();
    const credential_2 = document.getElementById('password');
    const password = credential_2.value;
    const credential_3 = document.getElementById('confirm-password');
    const confirmPassword = credential_3.value;

    // Clear previous messages
    messages.className = '';
    messages.innerHTML = '';

    // Basic validation
    if (username === "" || password === "" || confirmPassword === "") {
        showMessage("Please fill in all fields", "error");
        return;
    }

    if (username.length < 3) {
        showMessage("Username must be at least 3 characters long", "error");
        return;
    }

    if (password.length < 6) {
        showMessage("Password must be at least 6 characters long", "error");
        return;
    }

    if (password !== confirmPassword) {
        showMessage("Passwords do not match", "error");
        return;
    }

    // Show loading state
    createBtn.disabled = true;
    createBtn.classList.add('loading');
    showMessage("Creating account...", "info");

    try {
        const response = await fetch('/create-account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: username, password: password })
        });

        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.reply, "success");
            // Clear form on success
            credential_1.value = '';
            credential_2.value = '';
            credential_3.value = '';
            
            // Redirect to login after successful account creation
            if (data.reply.toLowerCase().includes('success')) {
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            }
        } else {
            showMessage(data.reply || "Account creation failed", "error");
        }
        
    } catch (error) {
        console.error('Error:', error);
        showMessage("Network error. Please try again.", "error");
    } finally {
        // Remove loading state
        createBtn.disabled = false;
        createBtn.classList.remove('loading');
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
                create();
            }
        });
    });
});