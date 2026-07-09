from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId

from app.classroom import bp
from app.utils import create_route_response
from app.services.classroom import *

base_route = "/classroom"

@bp.route(f"{base_route}/create", methods=['POST'])
@jwt_required()
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

    if status:
        payload["classroom_id"] = str(payload["classroom_id"])

    return create_route_response(status,payload,status_key)

@bp.route(f"{base_route}/invite", methods=['POST'])
@jwt_required()
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

@bp.route(f"{base_route}/add", methods=['POST'])
@jwt_required()
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

@bp.route(f"{base_route}/update", methods=['POST'])
@jwt_required()
def update():
    user_id = ObjectId(get_jwt_identity())
    result, data, result_key = _check_data(request.get_json())
    if not result:
        return create_route_response(result,data,result_key)

    result, to_change, result_key = _validate_update_data(data)

    if result_key:
        return create_route_response(result, to_change, result_key)

    result, message, result_key = update_classroom(user_id, ObjectId(data["classroomId"]), to_change)

    return create_route_response(result,message,result_key)

@bp.route(f"{base_route}/memberlist", methods=['GET'])
@jwt_required()
def member_list():
    classroom_id = request.args.get("classroomId")

    if not classroom_id:
        return create_route_response(
            False,
            "Missing classroom id",
            "BAD_REQUEST"
        )

    classroom_id = ObjectId(classroom_id)

    status, creator_info, status_key = get_creator_info(classroom_id)
    if not status:
        return create_route_response(status,creator_info,status_key)

    status, members_list, status_key = get_members_info(classroom_id)
    if not status:
        return create_route_response(status,members_list,status_key)

    payload = {
        "creator": creator_info,
        "members": members_list
    }

    return create_route_response(status,payload,status_key)

@bp.route(f"{base_route}/list", methods=['GET'])
@jwt_required()
def classroom_list():
    user_id = ObjectId(get_jwt_identity())
    status, data, status_key = get_classrooms(user_id)

    if status:
        for subject in data:
            subject["_id"] = str(subject["_id"])

    return create_route_response(status,data,status_key)

@bp.route(f"{base_route}/enter", methods=['GET'])
@jwt_required()
def enter():
    user_id = ObjectId(get_jwt_identity())
    classroom_id_str = request.args.get("classroomId")

    if not classroom_id_str:
        return create_route_response(
            False,
            "Missing classroom id",
            "BAD_REQUEST"
        )
    classroom_id = ObjectId(classroom_id_str)

    status, operation_completed, status_key = enter_classroom(user_id,classroom_id)

    return create_route_response(status,operation_completed,status_key)

@bp.route(f"{base_route}/info", methods=['GET'])
@jwt_required()
def get_info():
    classroom_id_str = request.args.get("classroomId")
    if not classroom_id_str:
        return create_route_response(
            False,
            "Missing classroom id",
            "BAD_REQUEST"
        )
    classroom_id = ObjectId(classroom_id_str)
    status, classroom_doc, status_key = get_classroom_info(classroom_id)

    return create_route_response(status,classroom_doc,status_key)

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

def _validate_update_data(data):

    if "classroomId" not in data:
        return False, "Missing classroom id", "BAD_REQUEST"

    allowed_fields = [
        "name",
        "subject_name",
        "description",
        "classroom_status"
    ]

    changes = {}

    for field in allowed_fields:
        if field in data:
            changes[field] = data[field]

    if not changes:
        return True, "No changes made", "NO_CHANGES"

    return True, changes, None