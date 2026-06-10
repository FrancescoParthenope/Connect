from config.database import users_collection

class TutorProfileManager:
    # static function that promotes a user to a tutor
    @staticmethod
    def promote_to_tutor(user_id):
        try:
            # searching and updating the user with user_id
            # that doesn't have "tutor" in "roles"
            user_filter = {
                "_id": user_id,
                "roles": {"$ne": "tutor"}
            }

            result = users_collection.update_one(
                user_filter,
                {
                    "$addToSet": {"roles": "tutor"},
                    "$set": {
                        "tutor_profile": {
                            "description": "",
                            "subjects": [],
                            "certifications": [],
                            "average_rating": 0.0,
                            "reviews_count": 0,
                            "cv_path": ""
                        }
                    }
                }
            )

            if result.matched_count == 0:
                return False, "User not found or already a tutor"

            if result.modified_count == 0:
                return False, "No changes applied"

            return True, "User promoted to Tutor"

        except Exception as e:
            return False, f"Error updating user in database : {str(e)}"

    @staticmethod
    def get_tutor_profile(user_id):
        # filter that controls if user is also a tutor
        user_filter = {
            "_id": user_id,
            "roles": "tutor"
        }
        try:
            result = users_collection.find_one(user_filter, {"tutor_profile": 1, "_id": 0})

            if not result:
                return False, "User not found or not a tutor"

            return True, result.get("tutor_profile", {})

        except Exception as e:
            return False, f"Error connecting to database : {str(e)}"

    @staticmethod
    def update_tutor_profile(user_id, update_fields = None):
        if update_fields is None:
            update_fields = {}

        if not update_fields:
            return False, "No Fields to Update"

        user_filter = {
            "_id": user_id,
            "roles": "tutor"
        }

        '''
        the database has a nested dictionary for tutor profile
        will create the right query using dictionary comprehension
        to update only the required fields specified in update_fields
        '''
        update_query = {
            "$set": {
                f"tutor_profile.{key}": value
                for key, value in update_fields.items()
            }
        }

        try:
            result = users_collection.update_one(user_filter, update_query)

            if result.matched_count == 0:
                return False, "User not found or not a tutor"

            if result.modified_count == 0:
                return False, "No changes applied"

            return True, "Tutor profile updated successfully"

        except Exception as e:
            return False, f"Error updating user in database : {str(e)}"

    @staticmethod
    def add_subject(user_id, subject_id):
        user_filter = {
            "_id": user_id,
            "roles": "tutor"
        }

        try:
            result = users_collection.update_one(user_filter,{
                "$addToSet": {
                    "tutor_profile.subjects": subject_id
                }
            })

            if result.matched_count == 0:
                return False, "User not found or not a tutor"
            if result.modified_count == 0:
                return False, "No changes applied"

            return True, "Tutor subject added successfully"

        except Exception as e:
            return False,  f"Error updating subjects in user tutor_profile in database : {str(e)}"

    @staticmethod
    def get_tutor_subjects(user_id):
        user_filter = {
            "_id": user_id,
            "roles": "tutor"
        }

        try:
            result = users_collection.find_one(user_filter, {"tutor_profile.subjects": 1, "_id": 0})

            if not result:
                return False, "User not found or not a tutor"

            # subject is still inside tutor profile
            # to get the list used 2 .get() with empty fallback values for security reason
            return True, result.get("tutor_profile", {}).get("subjects", [])

        except Exception as e:
            return False, f"Error connecting to database : {str(e)}"