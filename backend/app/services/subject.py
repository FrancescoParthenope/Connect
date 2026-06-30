from config.database import subjects_collection

class SubjectManager:
    @staticmethod
    def get_all_subjects():
        try:
            cursor = subjects_collection.find()

            subjects_list = list(cursor)

            if not subjects_list:
                return False, "No subjects found in database", "NOT_FOUND"

            return True, subjects_list, "SUCCESS"

        except Exception as e:
            return False, f"Error connecting to database : {str(e)}", "DB_ERROR"

    @staticmethod
    def get_subject_id(subject_name):
        try:
            subject_dict = subjects_collection.find_one({"name": subject_name}, {"_id": 1}) or {}
            subject_id = subject_dict.get("_id")

            if not subject_id:
                return False, "Subject not present in database", "NOT_FOUND"

            return True, subject_id, "SUCCESS"

        except Exception as e:
            return False, f"Error connecting to database : {str(e)}", "DB_ERROR"

    @staticmethod
    def get_filtered_subjects(subjects_filter): # subjects_filter must be a list of ObjectId
        try:

            cursor = subjects_collection.find(
                {"_id": {
                    "$nin": subjects_filter
                }}
            )

            output = list(cursor)

            return True, output, "SUCCESS"

        except Exception as e:
            return False, f"Error connecting to database : {str(e)}", "DB_ERROR"

    @staticmethod
    def get_subjects_by_field(field_name):
        try:

            cursor = subjects_collection.find({"field": field_name})
            output = list(cursor)

            return True, output, "SUCCESS"

        except Exception as e:
            return False, f"Error connecting to database : {str(e)}", "DB_ERROR"