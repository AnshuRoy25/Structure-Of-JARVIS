from flask import Blueprint, request, jsonify, session
from models.database import user_collection
import bcrypt

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/create-account', methods=['POST'])
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

@auth_bp.route('/login-account', methods=['POST'])
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