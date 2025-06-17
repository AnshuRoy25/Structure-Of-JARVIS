# Import necessary modules
from flask import Flask, render_template, request, jsonify, session
import ollama
from pymongo import MongoClient
from bson import ObjectId
import bcrypt

# Initialize the Flask app
app = Flask(__name__)
app.secret_key = '1234'  # Secret key used for securely signing session cookies

# ----------------------------- Database Setup -----------------------------

# Connect to the MongoDB server and define the database and collections
client = MongoClient('mongodb://localhost:27017/')
db = client['jarvis_database']
user_collection = db['users']  # Collection to store user data
conversations_collection = db['conversations']  # Collection to store chat history

# ----------------------------- Route Definitions -----------------------------

# Route for login page
@app.route('/')
def login():
    return render_template('login.html')

# Route for account creation page
@app.route('/create-page')
def create():
    return render_template('create.html')

# Route for homepage after successful login
@app.route('/home-page')
def home():
    return render_template('home.html')

# ----------------------------- Account Creation -----------------------------

# Route to handle creation of new user accounts
@app.route('/create-account', methods=['POST'])
def create_account():
    data = request.get_json()  # Get data sent from frontend as JSON
    username = data.get('username')
    password = str(data.get('password'))  # Ensure password is in string format

    # Hash the password using bcrypt
    password_bytes = password.encode('utf-8')
    hashed_password_bytes = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    hashed_password = hashed_password_bytes.decode('utf-8')

    # Check if username already exists in the database
    check_username = user_collection.find_one({"username": username})

    if check_username:
        return jsonify({"reply": "Username already exists"})
    else:
        # Store the new user's username and hashed password in the database
        user_collection.insert_one({ "username": username, "password": hashed_password })
        return jsonify({"reply": "Account Created Successfully"})

# ----------------------------- User Login -----------------------------

# Route to handle user login authentication
@app.route('/login-account', methods=['POST'])
def login_account():
    data = request.get_json()
    username = data.get('username')
    password = str(data.get('password'))

    # Find user by username
    check_user = user_collection.find_one({"username": username})

    if check_user:
        # Encode password and stored hash to bytes
        password_bytes = password.encode('utf-8')
        hashed_password = check_user.get('password')
        hashed_password_bytes = hashed_password.encode('utf-8')

        # Compare entered password with stored hashed password
        if bcrypt.checkpw(password_bytes, hashed_password_bytes):
            session['user_id'] = str(check_user['_id'])  # Store user ID in session
            return jsonify({"reply": "Login Successful"})
        else: 
            return jsonify({"reply": "Invalid Password"})
    else:
        return jsonify({"reply": "Invalid Username"})

# ----------------------------- Chat Handler -----------------------------

# Route to handle user chat input and get response from Ollama model
@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    userinput = data.get('userinput')     # Message input by the user
    modelname = data.get('modelname')     # AI model name (e.g., llama3, gemma)
    user_id = session.get('user_id')      # Get the logged-in user ID from session

    # Fetch previous conversations for this user from database
    previous_conversations = list(conversations_collection.find(
        {"user_id": ObjectId(user_id)},
        {"_id": 0, "role": 1, "content": 1}
    ))
    
    # Append current user message to conversation history
    previous_conversations.append({ "role": "user", "content": userinput })

    # Get AI-generated reply from Ollama
    response = ollama.chat(
        model = modelname,
        messages = previous_conversations,
    )

    reply = response['message']['content']  # Extract content from AI response

    # Save both user message and AI reply in the database
    conversations_collection.insert_many([
        { "user_id": ObjectId(user_id), "role": "user", "content": userinput },
        { "user_id": ObjectId(user_id), "role": "assistant", "content": reply }
    ])

    # Send the AI reply back to the frontend
    return jsonify({"reply": reply})

# ----------------------------- Run the App -----------------------------

# Run the app in debug mode
app.run(debug = True)
