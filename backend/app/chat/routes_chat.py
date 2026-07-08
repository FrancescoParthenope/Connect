from bson import ObjectId
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.chat import bp
from app.services.chat import *
from app.services.user import *

@bp.route('/chat', methods=['GET', 'POST'])
@jwt_required()
def chat_manager():

    if request.method == 'GET':
        action = request.args.get('action')

        if action == "get_messages":
            return get_messages()
        elif action == "get_conversation":
            return get_conversation()
        elif action == "get_private_conversations":
            return get_private_conversations()
        elif action == "search_user":
            return search_user()
        elif action == "get_classroom_conversations":
            return get_classroom_conversations()

        return jsonify({
            "success": False,
            "message": "Action not recognized"
        }), 400

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "message": "No data provided"
        }), 400

    action = data.get("action")

    if action == "send_message":
       return send_message(data)


    return jsonify({
        "success": False,
        "message": "Action not recognized"
    }), 400


#@bp.route('/chat', methods=['GET'])
#@jwt_required()
def get_private_conversations():

    email = request.args.get('email')

    if not email:
        return jsonify({
            "success": False,
            "message": "Other user not found"
        })

    current_user_id = ObjectId(get_jwt_identity())
    success, other_user_id, _ = get_user_id_by_email(email)

    if not success:
        return jsonify({
            "success": False,
            "message": other_user_id
        }), 400

    success, result = get_private_conversation(current_user_id, other_user_id)

    if not success:
        return jsonify({
            "success": False,
            "message": other_user_id
        }), 400

    result["_id"] = str(result["_id"])
    result["participants"] = [str(participant) for participant in result["participants"]]

    return jsonify({
        "success": True,
        "message": result
    }), 200

#@bp.route('/chat', methods=['GET'])
#@jwt_required()
def get_classroom_conversations():

    classroom_id = ObjectId(request.args.get('classroom_id'))

    success, result = get_classroom_conversation(classroom_id)

    if not success:
        return jsonify({
            "success": False,
            "message": result
        }), 400

    result["_id"] = str(result["_id"])
    result["classroom_id"] = str(result["classroom_id"])

    if "participants" in result:
        result["participants"] = [str(participant) for participant in result["participants"]]

    return jsonify({
        "success": True,
        "message": result
    }), 200


#@bp.route('/chat', methods=['GET'])
#@jwt_required()
def get_conversation():

    current_user_id = ObjectId(get_jwt_identity())

    success, result = get_conversations_list(current_user_id)

    if not success:
        return jsonify({
            "success": False,
            "message": result
        }), 400

    return jsonify({
        "success": True,
        "message": result
    }), 200


#@bp.route('/chat', methods=['GET'])
#@jwt_required()
def get_messages():

   conversation_id = ObjectId(request.args.get('conversation_id'))
   current_user_id = ObjectId(get_jwt_identity())

   if not conversation_id:
       return jsonify({
           "success": False,
           "message": "Conversation not found"
       }), 400

   success, result = get_message(conversation_id, current_user_id)

   if not success:
       return jsonify({
           "success": False,
           "message": result
       }), 400

   for message in result:
       message["_id"] = str(message["_id"])
       message["conversation_id"] = str(message["conversation_id"])
       message["sender_id"] = str(message["sender_id"])

   return jsonify({
       "success": True,
       "message": result
   }), 200


#@bp.route('/chat', methods=['POST'])
#@jwt_required()
def send_message(data):

    conversation_id = ObjectId(data['conversation_id'])
    sender_id = ObjectId(get_jwt_identity())
    message = data.get("message")

    if not conversation_id or not message:
        return jsonify({
            "success": False,
            "message": "Conversation or message not found"
        })

    success, result = send_messages(conversation_id, sender_id, message)

    if not success:
        return jsonify({
            "success": False,
            "message": result
        }), 400

    return jsonify({
        "success": True,
        "message": result
    }), 200


#@bp.route('/chat', methods=['GET'])
#@jwt_required()
def search_user():

    current_user_id = ObjectId(get_jwt_identity())

    success, result = search_users(current_user_id)

    if not success:
        return jsonify({
            "success": False,
            "message": result
        }), 400

    return jsonify({
        "success": True,
        "message": result
    }), 200



