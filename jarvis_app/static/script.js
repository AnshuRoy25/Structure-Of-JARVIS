// Wait until the entire page content is loaded before executing logic
document.addEventListener('DOMContentLoaded', async () => {
    initializeSidebarState(); // Add this line
    await onload_check();       // Check if there's an existing session and load messages
    await load_sessions();      // Load all previous session titles in the sidebar
    setupEventListeners();     // Setup additional event listeners
});

// Setup additional event listeners
// Setup additional event listeners
function setupEventListeners() {
    // Allow sending message with Enter key
    const input = document.getElementById('userinput');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
            }
        });
    }

    // Auto-focus input field
    if (input) {
        input.focus();
    }

    // Auto-resize textarea
    if (input && input.tagName === 'TEXTAREA') {
        input.addEventListener('input', autoResizeTextarea);
    }
    
    // Add mobile-specific event listeners
    document.addEventListener('click', handleOutsideClick);
    window.addEventListener('resize', handleResize);
    
    // Prevent zoom on input focus for iOS
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.style.fontSize = '16px';
            });
        });
    }
}

// Auto-resize textarea function
function autoResizeTextarea() {
    const textarea = document.getElementById('userinput');
    if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
}

// Auto-scroll to bottom of messages
function scrollToBottom(smooth = false) {
    const messagesContainer = document.querySelector('.chat-main');
    if (messagesContainer) {
        if (smooth) {
            messagesContainer.scrollTo({
                top: messagesContainer.scrollHeight,
                behavior: 'smooth'
            });
        } else {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }
}

// Show loading state for buttons
function setLoadingState(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (button) {
        if (isLoading) {
            button.disabled = true;
            button.classList.add('loading');
        } else {
            button.disabled = false;
            button.classList.remove('loading');
        }
    }
}

// Display message with proper styling according to CSS
function displayMessage(sender, content, isUser = false, isLoadingSession = false) {
    const messagesContainer = document.querySelector('.messages-container');
    if (!messagesContainer) return;

    // Create message wrapper
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'ai'}`;
    
    // Create message content
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Create sender label
    const messageSender = document.createElement('div');
    messageSender.className = 'message-sender';
    messageSender.textContent = sender;
    
    // Create message text
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    
    // Escape HTML to prevent XSS attacks and preserve line breaks
    const escapedContent = content
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');
    
    messageText.innerHTML = escapedContent;
    
    // Assemble message
    messageContent.appendChild(messageSender);
    messageContent.appendChild(messageText);
    messageDiv.appendChild(messageContent);
    
    // Add to messages container
    messagesContainer.appendChild(messageDiv);
    
    // Handle scrolling based on context
    if (!isLoadingSession) {
        // Only scroll smoothly for new messages (not when loading sessions)
        if (isUser) {
            // For user messages, scroll immediately to show the message
            setTimeout(() => {
                scrollToBottom(false);
            }, 50);
        } else {
            // For AI messages, scroll smoothly
            setTimeout(() => {
                scrollToBottom(true);
            }, 100);
        }
    }
}

// Sends user's message to backend and displays both user and AI response
async function send() {
    const modelname = document.getElementById("modelSelector")?.value || "meta-llama/llama-3.3-8b-instruct:free";
    const input = document.getElementById('userinput');
    
    if (!input || !input.value.trim()) return; // Prevent sending empty messages

    const userinput = input.value.trim();
    input.value = ""; // Clear input field after capturing value
    
    // Reset textarea height
    if (input.tagName === 'TEXTAREA') {
        input.style.height = 'auto';
    }

    // Display user message immediately
    displayMessage('You', userinput, true);

    // Set loading state
    setLoadingState('send-btn', true);

    try {
        // Send user input and model to the backend
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userinput, modelname })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Display AI's reply
        if (data.reply) {
            displayMessage('JARVIS', data.reply, false);
        } else {
            displayMessage('JARVIS', 'Sorry, I encountered an error processing your request.', false);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        displayMessage('JARVIS', 'Sorry, I encountered a network error. Please try again.', false);
    } finally {
        // Remove loading state
        setLoadingState('send-btn', false);
        
        // Re-focus input for better UX
        input.focus();
    }
}

// Starts a new chat session and updates the UI
async function newsession() {
    const messagesContainer = document.querySelector('.messages-container');
    const sessionCreationMessage = document.getElementById('session-creation-message');
    
    if (!messagesContainer || !sessionCreationMessage) return;

    // Prevents creating a new session if chat is already empty
    if (!messagesContainer.hasChildNodes() || messagesContainer.innerHTML.trim() === "") {
        showSessionMessage('You already have a new session', 'info');
        return;
    }

    // Set loading state
    setLoadingState('new-session-btn', true);

    try {
        // Request backend to start a new session
        const response = await fetch('/newsession', { method: 'POST' });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Show confirmation message
        showSessionMessage(data.reply || 'New session started', 'success');

        // Clear current chat area
        messagesContainer.innerHTML = "";

        // Create a new session button in the sidebar
        if (data.session_id && data.title) {
            addSessionToSidebar(data.session_id, data.title, true);
        }

    } catch (error) {
        console.error('Error creating new session:', error);
        showSessionMessage('Failed to create new session. Please try again.', 'error');
    } finally {
        // Remove loading state
        setLoadingState('new-session-btn', false);
    }
}

// Helper function to show session creation messages
function showSessionMessage(message, type) {
    const sessionCreationMessage = document.getElementById('session-creation-message');
    if (!sessionCreationMessage) return;

    sessionCreationMessage.innerHTML = message;
    sessionCreationMessage.className = `session-creation-message ${type} show`;

    // Clear message after 3 seconds
    setTimeout(() => {
        sessionCreationMessage.innerHTML = '';
        sessionCreationMessage.className = 'session-creation-message';
    }, 3000);
}

// Helper function to add session to sidebar
function addSessionToSidebar(sessionId, title, isNew = false) {
    const containerId = isNew ? 'sessions-container-new' : 'sessions-container';
    let container = document.getElementById(containerId);
    
    // If new session container doesn't exist, use the regular container
    if (!container) {
        container = document.querySelector('.sessions-container');
    }
    
    if (!container) return;

    const sessionDiv = document.createElement('div');
    sessionDiv.className = 'session';
    
    const sessionButton = document.createElement('button');
    sessionButton.textContent = title;
    sessionButton.onclick = () => load_session_chats(sessionId);
    sessionButton.title = title; // Tooltip for long titles

    sessionDiv.appendChild(sessionButton);
    
    if (isNew) {
        container.prepend(sessionDiv);
    } else {
        container.appendChild(sessionDiv);
    }
}

// Called on page load - restores chat messages from last session (if available)
async function onload_check() {
    try {
        const response = await fetch('/onload-check');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const messagesContainer = document.querySelector('.messages-container');
        
        if (!messagesContainer) return;
        
        messagesContainer.innerHTML = ""; // Clear chat display

        // If backend returned a previous session with messages
        if (data.success && data.conversations && Array.isArray(data.conversations)) {
            data.conversations.forEach(convo => {
                if (convo.role && convo.content) {
                    const sender = convo.role === 'user' ? 'You' : 'JARVIS';
                    const isUser = convo.role === 'user';
                    displayMessage(sender, convo.content, isUser, true);
                }
            });
            // Scroll to bottom immediately after loading all messages
            setTimeout(() => {
                scrollToBottom(false);
            }, 200);
        } else {
            // Show empty state if no messages
            showEmptyState();
        }
    } catch (error) {
        console.error('Error loading previous session:', error);
        showEmptyState();
    }
}

// Show empty state when no messages are present
function showEmptyState() {
    const messagesContainer = document.querySelector('.messages-container');
    if (!messagesContainer) return;

    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
        <h3>Welcome to JARVIS</h3>
        <p>Start a conversation by typing a message below. I'm here to help you with any questions or tasks you might have.</p>
    `;
    
    messagesContainer.appendChild(emptyState);
}

// Load list of all past sessions and show them in the sidebar
async function load_sessions() {
    const container = document.querySelector('.sessions-container');
    if (!container) return;

    try {
        const response = await fetch('/load-sessions');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        container.innerHTML = ""; // Clear any existing buttons

        // For each session, add a clickable button to load it
        if (data.sessions_list && Array.isArray(data.sessions_list)) {
            data.sessions_list.forEach(session => {
                if (session._id && session.title) {
                    addSessionToSidebar(session._id, session.title, false);
                }
            });
        }
    } catch (error) {
        console.error('Error loading sessions:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'session';
        errorDiv.innerHTML = '<button disabled>Failed to load sessions</button>';
        container.appendChild(errorDiv);
    }
}

// Load and display chat messages for a given session ID
async function load_session_chats(session_id) {
    if (!session_id) return;

    const messagesContainer = document.querySelector('.messages-container');
    if (!messagesContainer) return;

    messagesContainer.innerHTML = ""; // Clear chat area first

    try {
        // Request backend to send messages from the specified session
        const response = await fetch('/load-session-chats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Loop through each chat message and display
        if (data.session_chats && Array.isArray(data.session_chats)) {
            if (data.session_chats.length === 0) {
                showEmptyState();
            } else {
                data.session_chats.forEach(chat => {
                    if (chat.role && chat.content) {
                        const sender = chat.role === 'user' ? 'You' : 'JARVIS';
                        const isUser = chat.role === 'user';
                        displayMessage(sender, chat.content, isUser, true);
                    }
                });
                // Scroll to bottom immediately after loading all session messages
                setTimeout(() => {
                    scrollToBottom(false);
                }, 200);
            }
        } else {
            showEmptyState();
        }

        // Focus input after loading session
        const input = document.getElementById('userinput');
        if (input) {
            input.focus();
        }

    } catch (error) {
        console.error('Error loading session chats:', error);
        displayMessage('System', 'Failed to load session messages. Please try again.', false);
    }
}

// Utility function to format timestamps (if needed)
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}


// Toggle sidebar visibility
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const chatContainer = document.querySelector('.chat-container');
    const toggleBtn = document.getElementById('sidebar-toggle');
    
    if (!sidebar || !chatContainer || !toggleBtn) return;
    
    // Toggle classes
    sidebar.classList.toggle('open');
    chatContainer.classList.toggle('sidebar-open');
    toggleBtn.classList.toggle('active');
    
    // Store sidebar state in sessionStorage for persistence during the session
    const isOpen = sidebar.classList.contains('open');
    sessionStorage.setItem('sidebarOpen', isOpen.toString());
}


// Check sidebar state on page load
// Check sidebar state on page load
function initializeSidebarState() {
    const sidebar = document.getElementById('sidebar');
    const chatContainer = document.querySelector('.chat-container');
    const toggleBtn = document.getElementById('sidebar-toggle');
    
    if (!sidebar || !chatContainer || !toggleBtn) return;
    
    // Get saved state from sessionStorage (defaults to closed)
    const savedState = sessionStorage.getItem('sidebarOpen');
    const shouldBeOpen = savedState === 'true';
    
    // Only apply saved state on desktop
    if (shouldBeOpen && window.innerWidth > 768) {
        sidebar.classList.add('open');
        chatContainer.classList.add('sidebar-open');
        toggleBtn.classList.add('active');
    } else if (window.innerWidth <= 768) {
        // On mobile, always start with sidebar closed
        sidebar.classList.remove('open');
        chatContainer.classList.remove('sidebar-open');
        toggleBtn.classList.remove('active');
    }
}

// Handle clicks outside sidebar to close it on mobile
function handleOutsideClick(event) {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle');
    
    if (!sidebar || !toggleBtn) return;
    
    // Only handle this on mobile/tablet
    if (window.innerWidth > 768) return;
    
    // Check if sidebar is open
    if (!sidebar.classList.contains('open')) return;
    
    // Check if click is outside sidebar and not on toggle button
    if (!sidebar.contains(event.target) && !toggleBtn.contains(event.target)) {
        toggleSidebar();
    }
}

// Handle window resize to manage sidebar state
function handleResize() {
    const sidebar = document.getElementById('sidebar');
    const chatContainer = document.querySelector('.chat-container');
    const toggleBtn = document.getElementById('sidebar-toggle');
    
    if (!sidebar || !chatContainer || !toggleBtn) return;
    
    // If switching to desktop view and sidebar was closed, restore saved state
    if (window.innerWidth > 768) {
        const savedState = sessionStorage.getItem('sidebarOpen');
        const shouldBeOpen = savedState === 'true';
        
        if (shouldBeOpen) {
            sidebar.classList.add('open');
            chatContainer.classList.add('sidebar-open');
            toggleBtn.classList.add('active');
        }
    }
    // If switching to mobile view, close sidebar
    else {
        sidebar.classList.remove('open');
        chatContainer.classList.remove('sidebar-open');
        toggleBtn.classList.remove('active');
    }
}



