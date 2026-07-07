from datetime import datetime, timezone
from config.database import reviews_collection, users_collection, classrooms_collection

def create_review(student_id, tutor_id, rating, comment):
    try:
        if rating < 1 or rating > 5:
            return False, "Rating must be between 1 and 5"

        if comment:
            comment = comment.strip()
        else:
            comment = ""

        tutor = users_collection.find_one( {"_id": tutor_id},{"_id": 1})

        if not tutor:
            return False, "Tutor not found"

        classroom = classrooms_collection.find_one({
            "creator.creator_id": tutor_id,
            "members.user_id": student_id,
        })

        if not classroom:
            return False, "Student is not enrolled in this tutor's classroom"

        review = reviews_collection.find_one({
            "student_id": student_id,
            "tutor_id": tutor_id,
        })

        if review:
            return False, "You have already reviewed this tutor"

        reviews_collection.insert_one({
            "student_id": student_id,
            "tutor_id": tutor_id,
            "rating": rating,
            "comment": comment,
            "creation_date": datetime.now(timezone.utc),
        })

        _update_tutor_rating(tutor_id)

        return True, "Review created successfully"

    except Exception as e:
        return False, str(e)



def _update_tutor_rating(tutor_id):

    reviews = list(reviews_collection.find({
        "tutor_id": tutor_id,
    }))

    total_reviews = len(reviews)

    total_rating = 0

    for review in reviews:
        total_rating += review["rating"]

    average_rating = total_rating / total_reviews

    users_collection.update_one(
        {
            "_id": tutor_id
        },
        {
            "$set":{
                "tutor_profile.average_rating": average_rating,
                "tutor_profile.reviews_count": total_reviews,
            }
        }
    )

def get_review(tutor_id):
    try:
        reviews = list(reviews_collection.find({"tutor_id": tutor_id,}).sort("creation_date", -1))

        formatted_reviews = []

        for review in reviews:
            student = users_collection.find_one(
                {
                    "_id": review["student_id"],
                },
                {
                    "_id": 1,
                    "first_name": 1,
                    "last_name": 1,
                }
            )

            if not student:
                return False, "Student not found"

            formatted_reviews.append({
                "student_name": f"{student['first_name']} {student['last_name']}",
                "rating": review["rating"],
                "comment": review["comment"],
                "creation_date": review["creation_date"],
            })

        return True, formatted_reviews

    except Exception as e:
        return False, str(e)
