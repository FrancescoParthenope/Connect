from datetime import datetime, timezone
from config.database import conversations_collection, messages_collection, classrooms_collection
from app.services.user import *

def get_classroom_conversation(classroom_id):
    try:
        conversation = conversations_collection.find_one({
            "type": "classroom",
            "classroom_id": classroom_id
        })

        classroom = classrooms_collection.find_one(
            {"_id": classroom_id},
            {
                "_id": 1,
                "creator":1 ,
                "members": 1
            })

        if not classroom:
            return False, "Classroom not found"

        participants = []

        if "creator" in classroom:
            participants.append(classroom["creator"]["creator_id"])

        for member in classroom.get("members", []):
            participants.append(member["user_id"])

        if not conversation:
            creation_result = conversations_collection.insert_one({
                "type": "classroom",
                "classroom_id": classroom_id,
                "creation_date": datetime.now(timezone.utc),
                "last_activity": datetime.now(timezone.utc),
                "participants": participants
            })

            conversation = conversations_collection.find_one({
                "_id": creation_result.inserted_id
            })
        else:
            conversations_collection.update_one(
                {"_id": conversation["_id"]},
                {"$set": {"participants": participants}}
            )
            conversation["participants"] = participants

        return True, conversation

    except Exception as e:
        return False, str(e)


def get_private_conversation(current_user_id, other_user_id):
    try:
        conversation = conversations_collection.find_one({
            "type": "private",
            "participants": {
                "$all":[
                    current_user_id,
                    other_user_id
                ]
            }
        })

        if not conversation:
            creation_result = conversations_collection.insert_one({
                "type": "private",
                "participants": [current_user_id, other_user_id],
                "creation_date": datetime.now(timezone.utc),
                "last_activity": datetime.now(timezone.utc)
            })

            conversation = conversations_collection.find_one({"_id": creation_result.inserted_id})

        return True, conversation

    except Exception as e:
        return False, str(e)


def send_messages(conversation_id, sender_id, message):
    try:

        conversation = conversations_collection.find_one({
             "_id": conversation_id,
         })

        if not conversation:
             return False, "Conversation not found"

        messages_collection.insert_one({
            "conversation_id": conversation_id,
            "sender_id": sender_id,
            "message": message,
            "creation_date": datetime.now(timezone.utc),
        })

        conversations_collection.update_one(
            {"_id": conversation_id},
            {
                "$set": {
                     "last_activity": datetime.now(timezone.utc),
                }
            }
        )

        return True, "Message sent successfully"

    except Exception as e:
        return False, str(e)


def get_message(conversation_id, current_user_id):
    try:
        conversation = conversations_collection.find_one({
            "_id": conversation_id,
        })

        if not conversation:
            return False, "Conversation not found"

        messages = list(messages_collection.find({
            "conversation_id": conversation_id,
        }).sort("creation_date", 1))

        for message in messages:

            # Check the number of returned values because get_user_fname_lname()
            # may return either two or three values depending on the outcome.
            result = get_user_fname_lname(message["sender_id"])

            if len(result) == 3:
                success, user_info, _ = result
            else:
                success = False
                user_info = None

            if success:
                message["sender_name"] = (
                    f"{user_info['first_name']} {user_info['last_name']}"
                )
            else:
                message["sender_name"] = "Unknown User"

            message["is_mine"] = (
                message["sender_id"] == current_user_id
            )

        return True, messages

    except Exception as e:
        return False, str(e)


def get_conversations_list(current_user_id):
    try:
        conversations = list(conversations_collection.find({
            "type": "private", "participants": current_user_id
         }).sort("last_activity", -1))

        conversations_list = []

        for conversation in conversations:

            last_message = messages_collection.find_one({"conversation_id": conversation["_id"]},
            sort=[("creation_date", -1)])

            conversation_data = {
                "_id": str(conversation["_id"]),
                "type": conversation["type"],
                "last_activity": conversation["last_activity"],
                "last_message": last_message["message"] if last_message else "",
                "last_message_sent_by_me": (str(last_message["sender_id"]) == str(current_user_id)
                    ) if last_message else False
            }


            if conversation["type"] == "classroom":
                classroom = classrooms_collection.find_one({"_id": conversation["classroom_id"]})

                if classroom:
                    conversation_data["title"] = classroom["name"]
                else:
                    conversation_data["title"] = "Unknown Classroom"
            else:
                other_user = [
                    participant
                    for participant in conversation["participants"]
                    if participant != current_user_id
                ]

                if not other_user:
                    continue

                other_user = other_user[0]

                success, user_info, _ = get_user_fname_lname(other_user)

                if success:
                    conversation_data["title"] = (f"{user_info['first_name']} {user_info['last_name']}"
                    )
                else:
                    conversation_data["title"] = "Unknown User"

            conversations_list.append(conversation_data)

        return True, conversations_list

    except Exception as e:
        return False, str(e)


def search_users(current_user_id):
    try:
        users = list(users_collection.find({"_id": {"$ne": current_user_id }},
            {
                "_id": 0,
                "first_name": 1,
                "last_name": 1,
                "email": 1,
            }
        ))

        users_list = []

        for user in users:
             users_list.append({
                "email": user["email"],
                "first_name": user["first_name"],
                "last_name": user["last_name"],
            })

        return True, users_list

    except Exception as e:
        return False, str(e)




