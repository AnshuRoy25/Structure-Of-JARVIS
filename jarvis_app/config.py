import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("FLASK_SECRET_KEY")
    MONGODB_URI = os.getenv("MONGODB_URI")
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")