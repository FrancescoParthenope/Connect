from config.database import users_collection


def get_user_fname_lname(user_id):
    try:
        user_info = users_collection.find_one(
            {"_id": user_id},
            {"_id": 0,
             "first_name": 1,
             "last_name": 1,
             }
        )

        if not user_info:
            return "",""

        first_name = user_info.get("first_name", "")
        last_name = user_info.get("last_name", "")

        info = {
            "first_name": first_name,
            "last_name": last_name
        }

        return True, info, None

    except Exception as e:
        return False, f"Error connecting to database : {str(e)}", "DB_ERROR"

def get_classroom_user_info(user_id):
    try:
        info_to_get = {
            "_id": 0,
            "first_name": 1,
            "last_name": 1,
            "email": 1
        }
        user_info = users_collection.find_one({"_id": user_id},info_to_get)
        info = {
            "first_name": user_info.get("first_name", ""),
            "last_name": user_info.get("last_name", ""),
            "email": user_info.get("email", "")
        }

        return True, info, None

    except Exception as e:
        return False, f"Error connecting to database : {str(e)}", "DB_ERROR"

def get_user_id_by_email(email):
    try:
        user_info = users_collection.find_one({"email": email}, {"_id": 1})

        if not user_info:
            return False, "No user found with this email", "NOT_FOUND"

        return True, user_info.get("_id"), None

    except Exception as e:
        return False, f"Error connecting to database : {str(e)}", "DB_ERROR"