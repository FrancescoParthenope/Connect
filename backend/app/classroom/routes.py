from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId

from app.classroom import bp
from app.utils import create_route_response
from app.services.classroom import *

base_route = "/classroom"

@bp.route('/classroom-creation', methods=['POST'])
@jwt_required
def create():
    tutor_id = ObjectId(get_jwt_identity())
    status, data, status_key = _check_data(request.get_json())

    if not status:
        return create_route_response(status, data, status_key)

    status,message,status_key = _validate_creation_data(data)

    if not status:
        return create_route_response(status,message,status_key)

    description = data["description"] if "description" in data else ""

    status, payload, status_key = create_classroom(
        tutor_id,
        data["subjectName"],
        data["classroomName"],
        description
    )

    return create_route_response(status,message,status_key)

@bp.route('/invite', methods=['POST'])
@jwt_required
def invite():
    tutor_id = ObjectId(get_jwt_identity())
    status, data, status_key = _check_data(request.get_json())
    if not status:
        return create_route_response(status,data,status_key)

    status, message, status_key = _validate_invitation_data(data)
    if not status:
        return create_route_response(status,message,status_key)

    classroom_id = ObjectId(data["classroomId"])
    email = data["email"]

    status, message, status_key = invite_in_classroom(tutor_id, classroom_id, email)

    return create_route_response(status, message, status_key)

@bp.route('/add_classroom', methods=['POST'])
@jwt_required
def add_classroom():
    user_id = ObjectId(get_jwt_identity())
    data = request.get_json()
    if "inviteCode" not in data:
        return create_route_response(
            False,
            "missing invite code",
            "BAD_REQUEST"
        )
    status, message, status_key = add_to_classroom(user_id, data["inviteCode"])

    return create_route_response(status, message, status_key)

def _check_data(data):
    if not data:
        return False, "No data provided", "BAD_REQUEST"

    return True, data, None

def _validate_creation_data(data):
    if "classroomName" not in data:
        return False, "missing name for classroom", "BAD_REQUEST"
    if "subjectName" not in data:
        return False, "missing subject name for the classroom", "BAD_REQUEST"

    return True, None, None

def _validate_invitation_data(data):
    if "email" not in data:
        return False, "missing email for invitation", "BAD_REQUEST"
    if "classroomId" not in data:
        return False, "missing classroom id", "BAD_REQUEST"

    return True, None, None