from bson import ObjectId
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.user import bp
from app.services.tutor import *
from app.services.subject import *
from app.utils import create_route_response

@bp.route('/tutor', methods=['GET', 'POST'])
@jwt_required()
def tutor_manager():
    if request.method == 'GET':
        return get_tutor_profile()

    elif request.method == 'POST':
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400
        action = data.get("action")
        if action == "add_subject":
            return add_subject_to_tutor()
        elif action == "promote":
            return add_tutor_role()
        else:
            return jsonify({"success": False, "message": "Invalid action"}), 400
    else:
        return jsonify({"success": False, "message": "Invalid method"}), 400

# @bp.route('/add_tutor_role', methods=['POST'])
# @jwt_required()
def add_tutor_role():
    user_id = ObjectId(get_jwt_identity())

    result, message = promote_to_tutor(user_id)

    if not result:
        return jsonify({
            "success": False,
            "message": message
        }), 400
    return jsonify({
        "success": True,
        "message": message
    }),200

#@bp.route('/add_subject', methods=['POST'])
# @jwt_required()
def add_subject_to_tutor():
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data provided"}), 400

    if "subjectName" not in data:
        return jsonify({
            "success": False,
            "message": "Subject name does not exist"
        }), 400
    else:
        to_add = data["subjectName"]

    user_id = ObjectId(get_jwt_identity())

    try:
        subject = subjects_collection.find_one({"name": to_add}, {"field": 0})
        if subject is None:
            return jsonify({
                "success": False,
                "message": "Subject not in database"
            }), 404
        subject_id = ObjectId(subject["_id"])

        result, message = add_subject(user_id, subject_id)

        if not result:
            return jsonify({"success": False, "message": message}), 400

        return jsonify({"success": True, "message": message}), 200

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Error searching subject in database: {str(e)}"
        }),500
tors_list = []
# @bp.route('/get_tutor_profile', methods=['GET'])
# @jwt_required()
def get_tutor_profile():
    user_id = ObjectId(get_jwt_identity())
    result, message = get_tutor_profile(user_id)

    if not result:
        return jsonify({"success": False, "message": message}), 400

    return jsonify({"success": True,
                    "data": {
                        "description": message.get("description", ""),
                        "subjects": message.get("subjects", []),
                        "certifications": message.get("certifications", []),
                        "average_rating": message.get("average_rating", 0),
                        "reviews_count" : message.get("reviews_count", 0),
                        "cv_path": message.get("cv_path", "")
                    }
                    }), 200

@bp.route('/search_tutors', methods=['GET'])
@jwt_required()
def search_tutors():
    subject = request.args.get('subject')
    if not subject:
        return create_route_response(
            False,
            "No Subject provided",
            "BAD_REQUEST"
        )
    result, message, error_type = get_subject_id(subject)
    if not result:
        return create_route_response(result,message,error_type)

    result, message, error_type = get_tutors_list_by_subject(message)

    return create_route_response(result, message, error_type)

@bp.route('/mysubjects', methods=['GET'])
@jwt_required()
def get_my_subjects():
    user_id = ObjectId(get_jwt_identity())
    result, message, error_type = is_tutor(user_id)
    if not result:
        return create_route_response(result,message,error_type)

    result, message, error_type = get_tutor_subjects(user_id)

    return create_route_response(result, message, error_type)