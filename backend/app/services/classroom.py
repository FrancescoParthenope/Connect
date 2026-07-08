from app.services.subject import get_subject_id
from app.services.user import get_classroom_user_info, get_user_id_by_email
from app.services.tutor import is_tutor
from app.services.chat import get_private_conversation, send_messages
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

    status, message, status_key = is_tutor(tutor_id)
    if not status:
        return status, message, status_key

    status, info, status_key = get_classroom_user_info(tutor_id)
    if not status:
        return status, info, status_key

    first_name = info["first_name"]
    last_name = info["last_name"]
    email = info["email"]

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
            "creator_email": email
        },
        "members" : [],
        "description": description,
        "creation_date": datetime.now(timezone.utc),
        "invite_code": invite_code,
        "classroom_status": "open"
    }

    try:
        inserted = classrooms_collection.insert_one(classroom_info)

        return (
            True,
            {"classroom_id": inserted.inserted_id ,"message": "Classroom created successfully"},
            "CREATED"
        )

    except Exception as e:
        return False, f"Error connecting to database : {str(e)}", "DB_ERROR"

def invite_in_classroom(tutor_id, classroom_id, email):
    status, classroom_info = _check_owner(tutor_id, classroom_id)
    if not status:
        return False, "id passed is not from the owner of the classroom", "BAD_REQUEST"

    code = classroom_info["invite_code"]

    string_to_send = f"Invitation code for classroom: {code}"

    status, user_to_send_id, status_key = get_user_id_by_email(email)
    if not status:
        return False, user_to_send_id, status_key

    is_found, conversation = get_private_conversation(tutor_id, user_to_send_id)
    if not is_found:
        return False, "Can't recover the conversation from the database", "DB_ERROR"

    status, message = send_messages(conversation["_id"], tutor_id, string_to_send)

    if status:
        return True, message, "SUCCESS"
    else:
        return False, message, "DB_ERROR"

def add_to_classroom(user_id, invite_code):
    # we will save the name of the tutor as of the moment of the entrance of the classroom
    # so if the user changes the name it will not change what is shown in the classroom
    status, info, status_key = get_classroom_user_info(user_id)
    if not status:
        return status, info, status_key

    status, classroom_id = _verify_invitation_code(invite_code)
    if not classroom_id:
        return False, "Invitation code passed is not valid", "BAD_REQUEST"
    if not status:
        return status, classroom_id, "UNAUTHORIZED"

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

def update_classroom(tutor_id, classroom_id, changes):
    classroom = _check_owner(tutor_id, classroom_id)
    if not classroom:
        return False, "You are not the owner of this classroom", "UNAUTHORIZED"

    status_to_change = changes.get("classroom_status", "")
    if status_to_change:
        if status_to_change not in ["open", "closed", "deleted"]:
            return False, "Not a valid status change for the classroom", "BAD_REQUEST"

    subject_name = changes.get("subject_name","")
    subject = None
    to_update = {}

    if subject_name:
        status, subject_id, status_key = get_subject_id(subject_name)
        if not status:
            return status, subject_id, status_key
        subject = {
            "subject_id": subject_id,
            "subject_name": subject_name
        }

    for key, value in changes.items():
        if key == "subject_name":
            to_update["subject"] = subject
        elif key == "classroom_status":
            to_update["classroom_status"] = value
        else:
            to_update[key] = value

    try:
        if to_update:
            result = classrooms_collection.update_one(
                {"_id": classroom_id},
                {"$set": to_update}
            )
            if result.matched_count >0:
                if result.modified_count > 0:
                    return True, "Classroom updated successfully", "SUCCESS"
                return True, "No Updates done", "NO_CHANGES"

        return False, "Classroom not found", "NOT_FOUND"

    except Exception as e:
        return False, f"Error connecting to database : {str(e)}", "DB_ERROR"

def get_classroom_info(classroom_id):
    try:
        classroom_doc = classrooms_collection.find_one(
            {"_id": classroom_id},
            {"_id": 0,
             "name": 1,
             "subject.subject_name": 1,
             "description": 1,
             "classroom_status": 1}
        )
        if not classroom_doc:
            return False, "Classroom not found", "NOT_FOUND"

        return True, classroom_doc, "SUCCESS"

    except Exception as e:
        return False, f"Error connecting to database : {str(e)}", "DB_ERROR"

def get_creator_info(classroom_id):
    try:
        classroom_doc = classrooms_collection.find_one(
            {"_id": classroom_id},
            {"creator.creator_name":1,
             "creator.creator_last_name": 1,
             "creator.creator_email":1}
        )

        status, message, status_key = _check_classroom_doc(classroom_doc)
        if not status:
            return status, message, status_key

        creator = classroom_doc.get("creator", {})
        first_name = creator.get("creator_name", "")
        last_name = creator.get("creator_last_name", "")
        email = creator.get("creator_email","")

        tutor_info = {
            "first_name": first_name,
            "last_name": last_name,
            "email": email
        }

        return True, tutor_info, "SUCCESS"

    except Exception as e:
        return False, f"Error connecting to database : {str(e)}", "DB_ERROR"

def get_members_info(classroom_id):
    try:
        classroom_doc = classrooms_collection.find_one(
            {"_id": classroom_id},
            {"members": 1}
        )

        if not classroom_doc:
            return False, "Classroom not found", "NOT_FOUND"

        members = classroom_doc.get("members", [])
        info_list = []

        for member in members:
            first_name = member.get("user_first_name", "")
            last_name = member.get("user_last_name", "")
            email = member.get("user_email","")
            user_info = {
                "first_name": first_name,
                "last_name": last_name,
                "email": email
            }
            info_list.append(user_info)

        return True, info_list, "SUCCESS"

    except Exception as e:
        return False, f"Error connecting to database : {str(e)}", "DB_ERROR"

def enter_classroom(user_id, classroom_id):
    try:
        classroom_doc = classrooms_collection.find_one(
            {"_id": classroom_id},
            {"creator.creator_id": 1,
             "members.user_id": 1,
             "classroom_status": 1}
        )

        status, message, status_key = _check_classroom_doc(classroom_doc)
        if not status:
            return status, message, status_key

        creator = classroom_doc.get("creator", {})

        if user_id == creator.get("creator_id"):
            return True, True, "SUCCESS"

        classroom_status = classroom_doc.get("classroom_status", "")

        if classroom_status != "open":
            return False, "Class not open", "UNAUTHORIZED"

        member_is_found = False
        for member in classroom_doc.get("members", []):
            if member.get("user_id") == user_id:
                member_is_found = True
                break

        if not member_is_found:
            return False, "Member not in classroom", "UNAUTHORIZED"

        return True, True, "SUCCESS"

    except Exception as e:
        return False, f"Error connecting to database : {str(e)}", "DB_ERROR"

def get_classrooms(user_id):
    try:
        classroom_filter = {
            "classroom_status": {"$ne": "deleted"},
            "$or": [
                {"creator.creator_id": user_id},
                {"members.user_id": user_id}
            ]
        }

        cursor = classrooms_collection.find(classroom_filter,{
            "_id": 1,
            "name": 1,
            "creator.creator_name": 1,
            "creator.creator_last_name": 1,
            "subject.subject_name": 1,
            "classroom_status": 1
        })

        classrooms = list(cursor)

        return True, classrooms, "SUCCESS"

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
        return True, confirmed
    else:
        return False, None

def _verify_invitation_code(invite_code):
    found = classrooms_collection.find_one({"invite_code": invite_code}, {"_id": 1, "classroom_status": 1})

    if found:
        if found["classroom_status"] == "open":
            return True, found["_id"]
        else:
            return False, "Classroom is closed"
    else:
        return False, None

def _check_classroom_doc(classroom_doc):
    if not classroom_doc:
        return False, "Classroom not found", "NOT_FOUND"

    if "creator" not in classroom_doc:
        return False, "Creator not found", "NOT_FOUND"

    return True, None, None