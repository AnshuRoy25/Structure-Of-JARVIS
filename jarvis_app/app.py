from flask import Flask
from config import Config
from routes.main import main_bp
from routes.auth import auth_bp
from routes.chat import chat_bp

def create_app():
    app = Flask(__name__)
    app.secret_key = Config.SECRET_KEY
    
    # Register blueprints
    app.register_blueprint(main_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(chat_bp)
    
    return app

if __name__ == '__main__':
    import os
    app = create_app()
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))