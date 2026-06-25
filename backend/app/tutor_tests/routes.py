from bson import ObjectId
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import request
from app.tutor_tests import bp
from app.services import TutorProfileManager, SubjectManager, TutorTestManager
from app.utils import create_route_response

base_route = '/tutor_tests'

@bp.route(f"{base_route}/eligible_subjects", methods=['GET'])
@jwt_required()
def get_eligible_subjects():
    user_id = ObjectId(get_jwt_identity())

    status, content, status_key = TutorProfileManager.get_ineligible_subjects(user_id)

    if not status:
        return create_route_response(status,content,status_key)

    status, content, status_key = SubjectManager.get_filtered_subjects(content)

    if not status:
        return create_route_response(status,content,status_key)

    for subject in content:
        if "_id" in subject:
            subject["_id"] = str(subject["_id"])

    return create_route_response(status,content,status_key)

@bp.route(f"{base_route}/add_application", methods=['POST'])
@jwt_required()
def add_tutor_application():
    user_id = ObjectId(get_jwt_identity())

    data = request.get_json()

    if not data:
        return create_route_response(
            False,
            "No data provided",
            "BAD_REQUEST"
        )

    if "subjectId" not in data:
        return create_route_response(
            False,
            "No subject id provided",
            "BAD_REQUEST"
        )

    # try-catch block for being sure of using a valid ObjectID
    # and not generate an Internal Server Error
    try:
        subject_id = ObjectId(data["subjectId"])

    except Exception as e:
        return create_route_response(
            False,
            f"Invalid subject id provided, error: {str(e)}",
            "BAD_REQUEST"
        )

    status, message, status_key = TutorTestManager.assign_test_to_student(user_id, subject_id)

    return create_route_response(status,message,status_key)

@bp.route(f"{base_route}/pending_tests", methods=['GET'])
@jwt_required()
def get_pending_application():
    user_id = ObjectId(get_jwt_identity())

    status, data, status_key = TutorTestManager.get_all_pending_tests(user_id)

    return create_route_response(status,data,status_key)

@bp.route(f"{base_route}/start_test", methods=['POST'])
@jwt_required()
def start_tutor_test():
    user_id = ObjectId(get_jwt_identity())
    data = request.get_json()

    if not data:
        return create_route_response(
            False,
            "No data provided",
            "BAD_REQUEST"
        )

    if "subjectId" not in data:
        return create_route_response(
            False,
            "No subject id provided",
            "BAD_REQUEST"
        )

    subject_id = ObjectId(data["subjectId"])

    status, data, status_key = TutorTestManager.start_test(user_id, subject_id)

    if not status:
        return create_route_response(status,data,status_key)

    status, data, status_key = TutorTestManager.get_test_assigned(user_id, subject_id)

    return create_route_response(status,data,status_key)

@bp.route(f"{base_route}/answer", methods=['POST'])
@jwt_required()
def save_answer():
    user_id = ObjectId(get_jwt_identity())
    data = request.get_json()

    if not data:
        return create_route_response(
            False,
            "No data provided",
            "BAD_REQUEST"
        )

    if (
        "subjectId" not in data or
        "questionId" not in data or
        "answer" not in data
    ):
        return create_route_response(
            False,
            "Missing a necessary field",
            "BAD_REQUEST"
        )

    subject_id = ObjectId(data["subjectId"])
    question_id = ObjectId(data["questionId"])
    answer = data["answer"]

    status, data, status_key = TutorTestManager.save_single_answer(
        user_id, subject_id, question_id, answer
    )

    return create_route_response(status,data,status_key)