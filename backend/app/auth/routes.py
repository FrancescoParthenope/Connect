from flask import jsonify, request
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone
from app.auth import bp
from config.database import users_collection

# the route for the login request received
@bp.route('/login', methods=['POST'])
def login():
    # recovering json data from the request
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}),400

    email = data.get("email","").strip()
    password = data.get("password","").strip()

    # checking the presence of all data
    if not email or not password:
        return jsonify({"error": "missing an obligatory camp"}),400

    # searching user in MongoDB database
    user = users_collection.find_one({"email":email})

    # checking is user exists and if password is the right one
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "invalid credentials"}), 401

    # update the user last login on database
    users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_access": datetime.now(timezone.utc)}},
    )

    ## Create JWT access token using the user's ID as identity
    token = create_access_token(identity=str(user["_id"]))

    # successful response to frontend
    return jsonify({
        "success": True,
        "message": "Logged in successfully",
        "token": token,
        "user": {
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "email": user["email"],
            "roles": user["roles"],
        }
    }), 200

# the route for the registration request received
@bp.route('/register', methods=['POST'])
def register():
    # recovering json data from the request
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}),400

    email = data.get("email","").strip()
    password = data.get("password","")
    first_name = data.get("first_name","").strip()
    last_name = data.get("last_name","").strip()
    role = data.get("role","student").strip()

    # check data received
    if not email or not password or not first_name or not last_name:
        return jsonify({"error": "missing an obligatory camp"}), 400

    # role check, default fallback for the data is student
    # but a security check is done anyway
    if role not in ["student","tutor"]:
        return jsonify({"error": "role must be student or tutor"}), 400

    # check if the user exists already by email
    if users_collection.find_one({"email":email}):
        return jsonify({"error": "email already exists"}), 409

    # generating password hashing
    password_hash = generate_password_hash(password)

    # creating the new user
    new_user = {
        "email": email,
        "password_hash": password_hash,
        "first_name": first_name,
        "last_name": last_name,
        "bio": "",
        "roles": [role],
        "coins": 10, #at the first registration, a gift of 10 tokens is given
        "creation_date": datetime.now(timezone.utc),
        "last_access": datetime.now(timezone.utc),
    }
    if role == "tutor":
        new_user["tutor_profile"] = {
            "description": "",
            "subjects": [],
            "certifications": [],
            "average_rating": 0.0,
            "reviews_count": 0,
            "cv_path": ""
        }

    # insert new user into the database
    try:
        users_collection.insert_one(new_user)
        return jsonify({"message": "New user successfully created"}), 201
    except Exception as e:
        # error in inserting the new user into MongoDB
        return jsonify({"error": f"Error inserting the new user into the database: {str(e)}"}), 500