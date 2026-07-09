from bson import ObjectId
from flask import request, jsonify
from app.review import bp
from app.services.review import *
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.user import get_user_id_by_email

@bp.route('/review', methods=['POST', 'GET'])
@jwt_required()
def create_reviews():
    data = request.get_json()

    student_id = ObjectId(get_jwt_identity())
    email = data['email']
    rating = data['rating']
    comment = data.get("comment", "")

    success, tutor_id, _ = get_user_id_by_email(email)

    if not success:
        return jsonify({
            "success": False,
            "message": tutor_id
        }), 400

    success, result = create_review(student_id, tutor_id, rating, comment)

    if not success:
        return jsonify({
            "success": False,
            "message": result
        }), 400

    return jsonify({
        'success': True,
        'message': result
    }), 200

@bp.route('/viewReviews', methods=['GET'])
@jwt_required()
def get_reviews():
    user_id = ObjectId(get_jwt_identity())

    success, result = get_review(user_id)

    if not success:
        return jsonify({
            "success": False,
            "message": result
        }), 400

    return jsonify({
        'success': True,
        'message': result
    }), 200
