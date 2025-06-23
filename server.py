# --------- Imports ---------
from flask import Flask, render_template, request, jsonify, session
from pymongo import MongoClient
from bson import ObjectId
import bcrypt
from datetime import datetime
import pytz
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

# --------- App Setup ---------
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY")  # Secret key for managing user sessions


# --------- OpenAi Setup ---------
ai_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)

# --------- MongoDB Setup ---------
client = MongoClient(os.getenv("MONGODB_URI"))  # Connect to MongoDB server
db = client['jarvis_database']  # Use or create database
user_collection = db['users']  # Collection for user credentials
conversations_collection = db['conversations']  # Collection for chat messages
sessions_collection = db['sessions']  # Collection for storing chat sessions

# --------- Page Routes ---------
@app.route('/ping')
def ping():
    return {"status": "ok"}, 200

@app.route('/')
def login():
    # Serve the login page
    return render_template('login.html')

@app.route('/create-page')
def create():
    # Serve the create account page
    return render_template('create.html')

@app.route('/home-page')
def home():
    # Serve the chat interface after login
    return render_template('home.html', username=session['user_name'])

# --------- Create Account ---------
@app.route('/create-account', methods=['POST'])
def create_account():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Check if username already exists
    if user_collection.find_one({"username": username}):
        return jsonify({"reply": "Username already exists"})

    # Hash and store the new password
    hashed_pw = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    user_collection.insert_one({
        "username": username,
        "password": hashed_pw
    })

    return jsonify({"reply": "Account Created Successfully"})

# --------- Login Function ---------
@app.route('/login-account', methods=['POST'])
def login_account():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Find the user by username
    user = user_collection.find_one({"username": username})
    if user:
        # Compare hashed passwords
        if bcrypt.checkpw(password.encode(), user['password'].encode()):
            session['user_id'] = str(user['_id'])  # Store user ID in session
            session['user_name'] = user['username']  # Store username in session
            return jsonify({"reply": "Login Successful"})
        return jsonify({"reply": "Invalid Password"})
    return jsonify({"reply": "Invalid Username"})

# --------- Chat Handler ---------
@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    userinput = data.get('userinput')
    modelname = data.get('modelname')

    user_id = session.get('user_id')
    session_id = session.get('current_session_id')

    # Fetch previous messages from DB to continue the conversation context
    previous_msgs = list(conversations_collection.find(
        {"user_id": ObjectId(user_id), "session_id": ObjectId(session_id)},
        {"_id": 0, "role": 1, "content": 1}
    ))

    # Add the new user message
    previous_msgs.append({ "role": "user", "content": userinput })

    # Use Ollama to generate a response
    try:
        response = ai_client.chat.completions.create(
            model=modelname,
            messages=previous_msgs
        )
        reply = response.choices[0].message.content
    except:
        reply = "Sorry, Something went wrong."
        

    # Store both user and assistant messages in the DB
    conversations_collection.insert_many([
        { "user_id": ObjectId(user_id), "session_id": ObjectId(session_id), "role": "user", "content": userinput },
        { "user_id": ObjectId(user_id), "session_id": ObjectId(session_id), "role": "assistant", "content": reply }
    ])

    return jsonify({"reply": reply})

# --------- Start New Chat Session ---------
@app.route('/newsession', methods=['POST'])
def newsession():
    ist_now = datetime.now(pytz.timezone('Asia/Kolkata'))
    user_id = session.get('user_id')

    # Title format includes timestamp
    title = "Chat | " + ist_now.strftime("%I:%M %p - %d %B %Y")

    # Create a new session entry
    new_session = sessions_collection.insert_one({
        "user_id": ObjectId(user_id),
        "title": title,
        "created_at": ist_now
    })

    # Save current session ID in session
    session['current_session_id'] = str(new_session.inserted_id)
    return jsonify({
        "reply": "New session created",
        "session_id": str(new_session.inserted_id),
        "title": title
    })

# --------- Onload Check for Existing Session ---------
@app.route('/onload-check')
def onload_check():
    user_id = session.get('user_id')

    # Get the most recent session
    session_doc = sessions_collection.find_one(
        {"user_id": ObjectId(user_id)},
        sort=[("created_at", -1)]
    )

    if session_doc:
        session['current_session_id'] = str(session_doc['_id'])

        # Load all conversations for this session
        chats = list(conversations_collection.find(
            {"user_id": ObjectId(user_id), "session_id": ObjectId(session_doc['_id'])},
            {"_id": 0, "role": 1, "content": 1}
        ))
        return jsonify({ "success": True, "conversations": chats })

    # If no session, create one
    ist_now = datetime.now(pytz.timezone('Asia/Kolkata'))
    title = "Chat | " + ist_now.strftime("%I:%M %p - %d %B %Y")
    new_session = sessions_collection.insert_one({
        "user_id": ObjectId(user_id),
        "title": title,
        "created_at": ist_now
    })
    session['current_session_id'] = str(new_session.inserted_id)
    return jsonify({ "success": False })

# --------- Load All User Sessions ---------
@app.route('/load-sessions')
def load_sessions():
    user_id = session.get('user_id')

    # Get all sessions for the user
    sessions_list = list(sessions_collection.find(
        {"user_id": ObjectId(user_id)},
        {"_id": 1, "title": 1},
        sort=[("created_at", -1)]
    ))

    # Convert ObjectIds to string
    for s in sessions_list:
        s['_id'] = str(s['_id'])

    return jsonify({ "sessions_list": sessions_list })

# --------- Load Chats of a Selected Session ---------
@app.route('/load-session-chats', methods=['POST'])
def load_session_chats():
    user_id = session.get('user_id')
    session_id = request.get_json().get('session_id')

    # Update session tracker
    session['current_session_id'] = session_id

    # Load all chats of this session
    chats = list(conversations_collection.find(
        {"user_id": ObjectId(user_id), "session_id": ObjectId(session_id)},
        {"_id": 0, "role": 1, "content": 1}
    ))

    return jsonify({ "session_chats": chats })

# --------- Run the Flask App ---------
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

