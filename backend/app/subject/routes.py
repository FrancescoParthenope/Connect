from flask import request
from flask_jwt_extended import jwt_required
from app.subject import bp
from app.services import SubjectManager
from app.utils import create_route_response

base_route = '/subjects'

@bp.route(f"{base_route}/all_subjects", methods=['GET'])
@jwt_required()
def find_all_subjects():
    status, message, status_key = SubjectManager.get_all_subjects()

    if status:
        for subject in message:
            subject["_id"] = str(subject["_id"])

    return create_route_response(status, message, status_key)

@bp.route(f"{base_route}/subjects_fields", methods=['GET'])
@jwt_required()
def filter_subjects_by_fields():
    data = request.args.get('field')

    is_str = isinstance(data, str)

    if not data or not is_str or data.strip() == "":
        if not is_str:
            return create_route_response(
                False,
                "Passed an invalid argument for field",
                "BAD_REQUEST"
            )
        return create_route_response(
            False,
            "No field was provided",
            "BAD_REQUEST"
        )

    status, message, status_key = SubjectManager.get_subjects_by_field(data)

    return create_route_response(status, message, status_key)