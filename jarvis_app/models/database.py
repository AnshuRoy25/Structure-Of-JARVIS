from pymongo import MongoClient
from openai import OpenAI
from config import Config

# MongoDB Setup
client = MongoClient(Config.MONGODB_URI)
db = client['jarvis_database']
user_collection = db['users']
conversations_collection = db['conversations']
sessions_collection = db['sessions']

# OpenAI Setup
ai_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=Config.OPENROUTER_API_KEY
)