// Wait until the entire page content is loaded before executing logic
document.addEventListener('DOMContentLoaded', async () => {
    await onload_check();       // Check if there's an existing session and load messages
    await load_sessions();      // Load all previous session titles in the sidebar
});

// Sends user's message to backend and displays both user and AI response
async function send() {
    const modelname = document.getElementById("modelSelector").value; // Get selected model from dropdown
    const input = document.getElementById('userinput');               // Access the input field
    const userinput = input.value;                                    // Store user’s input

    if (userinput === '') return;  // Prevent sending empty messages

    input.value = "";  // Clear input field after capturing value

    const messages = document.getElementById('messages');  // Container to display chat
    messages.innerHTML += `<div>You: ${userinput}<div>`;   // Append user message to UI

    // Send user input and model to the backend
    const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userinput, modelname })
    });

    const data = await response.json();  // Parse server response (contains AI reply)

    // Display AI's reply on screen
    messages.innerHTML += `<div>JARVIS: ${data.reply}<div>`;
}

// Starts a new chat session and updates the UI
async function newsession() {
    const messages = document.getElementById('messages');  // Chat display area
    const session_creation_message = document.getElementById('session-creation-message'); // Message feedback area

    // Prevents creating a new session if chat is already empty
    if (messages.innerHTML === "") {
        session_creation_message.innerHTML = `You already created one`;
        return;
    }

    // Request backend to start a new session
    const response = await fetch('/newsession', { method: 'POST' });
    const data = await response.json();

    // Show confirmation message (e.g., "New session started")
    session_creation_message.innerHTML = `${data.reply}`;

    // Clear current chat area
    messages.innerHTML = "";

    // Create a new session button in the sidebar
    const sessionDiv = document.createElement('div');
    const sessionButton = document.createElement('button');
    sessionButton.textContent = data.title;  // Display title of the session
    sessionButton.onclick = () => load_session_chats(data.session_id); // Load this session when clicked

    sessionDiv.appendChild(sessionButton);
    document.getElementById('sessions-container-new').prepend(sessionDiv); // Add to top of sidebar
}

// Called on page load - restores chat messages from last session (if available)
async function onload_check() {
    const response = await fetch('/onload-check'); // Ask backend if a session exists
    const data = await response.json();
    const messages = document.getElementById('messages');
    messages.innerHTML = ""; // Clear chat display

    // If backend returned a previous session with messages
    if (data.success) {
        data.conversations.forEach(convo => {
            const sender = convo.role === 'user' ? 'You' : 'JARVIS'; // Label sender
            messages.innerHTML += `<div>${sender}: ${convo.content}<div>`; // Append each message
        });
    }
}

// Load list of all past sessions and show them in the sidebar
async function load_sessions() {
    const container = document.getElementById('sessions-container-previous');
    container.innerHTML = ""; // Clear any existing buttons

    const response = await fetch('/load-sessions');
    const data = await response.json();

    // For each session, add a clickable button to load it
    data.sessions_list.forEach(session => {
        const button = `<div><button onclick="load_session_chats('${session._id}')">${session.title}</button></div>`;
        container.innerHTML += button;
    });
}

// Load and display chat messages for a given session ID
async function load_session_chats(session_id) {
    const messages = document.getElementById('messages');
    messages.innerHTML = "";  // Clear chat area first

    // Request backend to send messages from the specified session
    const response = await fetch('/load-session-chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id })
    });

    const data = await response.json();

    // Loop through each chat message and display
    data.session_chats.forEach(chat => {
        const sender = chat.role === 'user' ? 'You' : 'JARVIS';
        messages.innerHTML += `<div>${sender}: ${chat.content}<div>`;
    });
}
