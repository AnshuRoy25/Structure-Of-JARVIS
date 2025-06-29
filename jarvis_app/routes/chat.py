from flask import Blueprint, request, jsonify, session
from models.database import conversations_collection, sessions_collection, ai_client
from bson import ObjectId
from datetime import datetime
import pytz

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/chat', methods=['POST'])
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

@chat_bp.route('/newsession', methods=['POST'])
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

@chat_bp.route('/onload-check')
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

@chat_bp.route('/load-sessions')
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

@chat_bp.route('/load-session-chats', methods=['POST'])
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