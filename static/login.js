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
                login();
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