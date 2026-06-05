from flask import jsonify, request, session
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
        return jsonify({"error": "No data provided"})

    email = data.get("email","").strip()
    password = data.get("password","").strip()

    # checking the presence of all data
    if not email or not password:
        return jsonify({"error": "missing an obligatory camp"})

    # searching user in MongoDB database
    user = users_collection.find_one({"email":email})

    # checking is user exists and if password is the right one
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "invalid credentials"}), 401

    # saving user important information in flask session
    session.clear() # clear old session eventually
    session["user_id"] = str(user["_id"]) # recovering MongoDB ObjectID and converting into a string
    session["email"] = user["email"] # recovering user email
    session["roles"] = user["roles"] # recovering user roles

    # update the user last login on database
    users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_access": datetime.now(timezone.utc)}},
    )

    # successful response to frontend
    return jsonify({
        "success": True,
        "message": "Logged in successfully",
        "user": {
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "email": user["email"],
            "roles": user["roles"],
        }
    }), 200

# method is post for avoiding cross-site-request-forgery (CSRF)
@bp.route('/logout', methods=['POST'])
def logout():
    # check if the user has an active session
    if "user_id" not in session:
        return jsonify(
            {"success": False},
            {"error": "no active session found, impossible to logout"}
        ), 400
    # clearing the current session, deleting all data stored in it
    session.clear()

    # respond to the frontend for a successful logout
    return jsonify(
        {"success": True},
        {"message": "Logged out successfully"}
    ),200

# the route for the registration request received
@bp.route('/register', methods=['POST'])
def register():
    # recovering json data from the request
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"})

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
        "birth_date": None,
        "profile_picture": None,
        "bio": "",
        "roles": [role],
        "tutor_profile": None,
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