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
    
    // Scroll message into view on mobile if needed
    if (window.innerWidth <= 480) {
        setTimeout(() => {
            messages.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
}

// Enhanced mobile support
document.addEventListener('DOMContentLoaded', function() {
    const inputs = document.querySelectorAll('input');
    const buttons = document.querySelectorAll('button');
    
    // Add Enter key support
    inputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                create();
            }
        });
        
        // Handle focus for better mobile experience
        input.addEventListener('focus', function() {
            // Slight delay to ensure virtual keyboard is shown
            setTimeout(() => {
                if (window.innerWidth <= 480) {
                    this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        });
        
        // Prevent zoom on iOS when focusing inputs
        input.addEventListener('touchstart', function() {
            if (this.style.fontSize !== '16px') {
                this.style.fontSize = '16px';
            }
        });
    });
    
    // Enhanced touch support for buttons
    buttons.forEach(button => {
        // Prevent double-tap zoom on iOS
        button.addEventListener('touchend', function(e) {
            e.preventDefault();
            this.click();
        });
        
        // Add haptic feedback simulation
        button.addEventListener('touchstart', function() {
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        });
    });
    
    // Real-time password validation feedback
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    function validatePasswords() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword && password !== confirmPassword) {
            confirmPasswordInput.style.borderColor = 'rgba(239, 68, 68, 0.5)';
        } else {
            confirmPasswordInput.style.borderColor = '';
        }
    }
    
    passwordInput.addEventListener('input', validatePasswords);
    confirmPasswordInput.addEventListener('input', validatePasswords);
    
    // Handle orientation changes
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            // Recalculate viewport and scroll position
            window.scrollTo(0, 0);
            
            // Ensure proper scaling
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            }
        }, 500);
    });
    
    // Handle visual viewport changes (for when virtual keyboard appears)
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', function() {
            const viewportHeight = window.visualViewport.height;
            const windowHeight = window.innerHeight;
            
            // Adjust body height when virtual keyboard appears
            if (viewportHeight < windowHeight * 0.75) {
                document.body.style.height = viewportHeight + 'px';
            } else {
                document.body.style.height = '100vh';
            }
        });
    }
    
    // Prevent rubber band scrolling on iOS
    document.addEventListener('touchmove', function(e) {
        if (e.touches.length === 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Handle back button on mobile browsers
    window.addEventListener('popstate', function(e) {
        // Custom handling if needed
    });
});