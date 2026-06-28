import os
from pymongo import MongoClient
from dotenv import load_dotenv

# loading locale variables from .env file
load_dotenv()

# security check, default values as in .env file
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("MONGO_DATABASE","connect_db")

try:
    # initialization
    client = MongoClient(MONGO_URI, tz_aware=True)

    # test ping
    client.admin.command('ping')

    #select (or create if it doesn't exist) database
    db = client[DB_NAME]

    #references to the collections as in docs/mongodb_scheme.txt
    users_collection = db["users"]
    subjects_collection = db["subjects"]
    classrooms_collection = db["classrooms"]
    classrooms_documents_collection = db["classrooms_documents"]
    conversations_collection = db["conversations"]
    messages_collection = db["messages"]
    tests_collection = db["tests"]
    tests_submissions_collection = db["tests_submissions"]
    reviews_collection = db["reviews"]
    coins_transactions_collection = db["coins_transactions"]
    tutoring_sessions_collection = db["tutoring_sessions"]
    tutor_tests_collection = db["tutor_tests"]
    tests_sessions_collection = db["test_sessions"]

    print(f"Connection to MongoDB successful, database: {DB_NAME}")

except Exception as e:
    print(f"Connection to MongoDB failed: {e}")

