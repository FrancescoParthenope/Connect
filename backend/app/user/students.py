from bson import ObjectId
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from app.services.tutor import TutorProfileManager
from app.user import bp
from config.database import users_collection

@bp.route('/profile', methods=['GET','POST'])
@jwt_required()
def profile_manager():
    if request.method == 'GET':
        return get_profile()
    elif request.method == 'POST':
        return update_profile()
    else:
        return jsonify({"success": False, "message": "Invalid method"}), 400

# @bp.route('/get_profile', methods=['GET'])
# @jwt_required()
def get_profile():

    # get the user id from jwt and transforms it to binary mongodb code
    user_id = ObjectId(get_jwt_identity())

    fields_requested = {'first_name': 1,
                        'last_name': 1,
                        'birth_date': 1,
                        'profile_picture': 1,
                        'bio': 1,
                        '_id': 0}

    try:
        # fetch user from database
        user_profile_info = users_collection.find_one({'_id': user_id}, fields_requested)

        # check user
        if not user_profile_info:
            return jsonify({"success": False, "message": "User not found"}), 404

        # need to reconvert data to string from datetime
        date_retrieved = user_profile_info.get("birth_date","")

        if date_retrieved is None:
            date_retrieved = ""

        if isinstance(date_retrieved, datetime):
            date_retrieved = date_retrieved.strftime('%Y-%m-%d')

        return jsonify({
            "success": True,
            "data": {
                "first_name": user_profile_info.get("first_name", ""),
                "last_name": user_profile_info.get("last_name", ""),
                "birth_date": date_retrieved,
                "profile_picture": user_profile_info.get("profile_picture", ""),
                "bio": user_profile_info.get("bio", "")
            }
        }),200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error recovering user data from database: {str(e)}"
        }), 500

# @bp.route('/update_profile', methods=['POST'])
# @jwt_required()
def update_profile():

    # get the user id from jwt and transforms it to binary mongodb code
    user_id = ObjectId(get_jwt_identity())

    # get JSON body from request
    data = request.get_json()

    # check data
    if not data:
        return jsonify({"error": "No data provided"}), 400

    #allowed fields for update
    allowed_fields = ['first_name', 'last_name', 'birth_date', 'profile_picture','bio']

    update_fields = {}

    # build update dictionary with fields only
    for field in allowed_fields:
        if field in data:
            update_fields[field] = data[field]

    # changing the birthday from string to date
    if 'birth_date' in update_fields and update_fields['birth_date']:
        try:
            str_date = update_fields['birth_date']
            # assuming date format YYYY-MM-DD
            converted_date = datetime.strptime(str_date, '%Y-%m-%d')

            update_fields['birth_date'] = converted_date
        except ValueError:
            return jsonify({
                "success": False,
                "message": "Birth date format is invalid"
            }),400

    #check if there is something to update
    if not update_fields:
        return jsonify({"success": False, "message": "No valid fields to update"}), 400

    # setting the filter for the update operation
    user_filter = {'_id': user_id}

    try:
        # update if user in database
        result = users_collection.update_one(user_filter, {"$set": update_fields})

        # check if updates have been done
        if result.modified_count >0 :
            return jsonify({
                "success": True,
                "message": "Profile updated successfully"
            }), 200
        else:# @bp.route('/update_profile', methods=['POST'])
            return jsonify({
                "success": True,
                "message": "No update done, datas remain unchanged"
            }), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error updating user in database : {str(e)}"
        }), 500

@bp.route('/search_tutors', methods=['GET'])
@jwt_required()
def search_tutors():

    subject = request.args.get('subject')
    if not subject:
        return jsonify({"success": False, "message": "No subject provided"}), 400

    result, message, error_type = TutorProfileManager.get_tutors_list_by_subject(subject)

    if not result:
        if error_type == "NOT_FOUND":
            return jsonify({"success": False, "message": message}), 404
        elif error_type == "DB_ERROR":
            return jsonify({"success": True, "data": message}), 500


    return jsonify({"success": True, "data": message}), 200