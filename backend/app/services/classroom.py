from app.services.subject import get_subject_id
from app.services.user import get_user_fname_lname, get_classroom_user_info, get_user_id_by_email
from app.services.chat import get_private_conversation, send_message
from datetime import datetime, timezone
import secrets
import string

from config.database import classrooms_collection

INVITATION_DOMAIN = string.ascii_letters + string.digits

def create_classroom(tutor_id, subject_name, classroom_name, description = ""):
    status, subject_id, status_key = get_subject_id(subject_name)
    if not status:
        return status, subject_id, status_key

    subject = {
        "subject_id": subject_id,
        "subject_name": subject_name
    }

    status, info, status_key = get_user_fname_lname(tutor_id)
    if not status:
        return status, info, status_key

    first_name = info["first_name"]
    last_name = info["last_name"]

    if first_name == "" or last_name == "":
        return False, "Error while retrieving tutor names", "NOT_FOUND"

    if classroom_name == "":
        classroom_name = f"Classroom of {first_name} {last_name} for {subject_name}"

    invite_code = _generate_invite_code()

    classroom_info = {
        "subject": subject,
        "name": classroom_name,
        "creator": {
            "creator_id": tutor_id,
            "creator_name": first_name,
            "creator_last_name": last_name,
        },
        "description": description,
        "creation_date": datetime.now(timezone.utc),
        "invite_code": invite_code
    }

    try:
        classrooms_collection.insert_one(classroom_info)

        return True, "Classroom created successfully", "CREATED"

    except Exception as e:
        return False, f"Error connecting to database : {str(e)}", "DB_ERROR"

def invite_in_classroom(tutor_id, classroom_id, email):
    code = _check_owner(tutor_id, classroom_id)
    if not code:
        return False, "id passed is not from the owner of the classroom", "BAD_REQUEST"

    status, user_to_send_id, status_key = get_user_id_by_email(email)
    if not status:
        return False, user_to_send_id, status_key

    is_found, conversation = get_private_conversation(tutor_id, user_to_send_id)
    if not is_found:
        return False, "Can't recover the conversation from the database", "DB_ERROR"

    status, message = send_message(conversation["_id"], tutor_id, code)

    if status:
        return True, message, "SUCCESS"
    else:
        return False, message, "DB_ERROR"

def add_to_classroom(user_id, invite_code):
    status, info, status_key = get_classroom_user_info(user_id)
    if not status:
        return status, info, status_key

    classroom_id = _verify_invitation_code(invite_code)
    if not classroom_id:
        return False, "Invitation code passed is not valid", "BAD_REQUEST"

    try:
        operation_result = classrooms_collection.update_one(
            {
                "_id": classroom_id,
                "members.user_id": {
                    "$ne": user_id
                }
            },
            {
                "$addToSet": {
                    "members": {
                        "user_id": user_id,
                        "user_first_name": info["first_name"],
                        "user_last_name": info["last_name"],
                        "user_email": info["email"],
                        "join_date": datetime.now(timezone.utc),
                    }
                }
            }
        )

        if operation_result.matched_count == 0:
            return False, "User already in classroom", "ALREADY_EXISTS"

        return True, "User added successfully to classroom", "SUCCESS"

    except Exception as e:
        return False, f"Error connecting to database : {str(e)}", "DB_ERROR"


def _generate_invite_code():
    while True:
        code = "".join(secrets.choice(INVITATION_DOMAIN) for _ in range(6))
        exists = classrooms_collection.find_one({"invite_code": code})
        if not exists:
            return code

def _check_owner(tutor_id, classroom_id):
    confirmed = classrooms_collection.find_one(
        {
            "_id": classroom_id,
            "creator.creator_id": tutor_id
        },
        {
            "_id": 0,
            "invite_code": 1
        }
    )

    if confirmed:
        return confirmed["invite_code"]
    else:
        return False

def _verify_invitation_code(invite_code):
    found = classrooms_collection.find_one({"invite_code": invite_code}, {"_id": 1})

    if found:
        return found["_id"]
    else:
        return False