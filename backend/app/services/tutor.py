from config.database import users_collection, subjects_collection


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

            tutor_profile = result.get("tutor_profile", {})

            subjects_name = []
            subjects_ids = tutor_profile.get("subjects", [])

            if subjects_ids:
                cursor = subjects_collection.find(
                    {"_id": {"$in": subjects_ids}},
                    {"name": 1, "_id": 0}
                )
                for subject in cursor:
                    subjects_name.append(subject["name"])

            tutor_profile["subjects"] = subjects_name

            return True, tutor_profile

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

    '''
    # useless ?
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
    '''

    @staticmethod
    def get_tutors_list_by_subject(subject):
        try:
            subject_dict = subjects_collection.find_one({"name": subject}, {"_id": 1}) or {}
            subject_id = subject_dict.get("_id")

            if not subject_id:
                return False, "Subject not present in database", "NOT_FOUND"

            query_filter = {
                "roles": "tutor",
                "tutor_profile.subjects": subject_id
            }

            info_tutor = {
                "_id": 0,
                "first_name": 1,
                "last_name": 1,
                "profile_picture": 1,
                "tutor_profile.description": 1,
                "tutor_profile.average_rating": 1,
                "tutor_profile.reviews_count" : 1,
            }

            cursor = users_collection.find(query_filter, info_tutor)

            tutors_list = []

            for tutor in cursor:
                tutors_list.append(tutor)

            return True, tutors_list, None

        except Exception as e:
            return False, f"Error connecting to database : {str(e)}", "DB_ERROR"