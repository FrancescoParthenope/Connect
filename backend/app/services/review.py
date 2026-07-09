from datetime import datetime, timezone
from config.database import reviews_collection, users_collection, classrooms_collection
from app.services.user import get_classroom_user_info

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

def get_review(user_id):
    try:
        review_query = {
            "$or": [
                {"student_id": user_id},
                {"tutor_id": user_id}
            ]
        }
        reviews = list(reviews_collection.find(review_query).sort("creation_date", -1))

        if not reviews:
            return True, []

        formatted_reviews = []
        status, user_info, status_key = get_classroom_user_info(user_id)
        if not status:
            return False, []

        for review in reviews:
            if review["tutor_id"] == user_id:
                status,student_info, status_key = get_classroom_user_info(review["student_id"])
                if not status:
                    return False, []
                student_name = f"{student_info.get('first_name','')} {student_info.get('last_name','')}"
                tutor_name = f"{user_info.get('first_name','')} {user_info.get('last_name','')}"
            else:
                status, tutor_info, status_key = get_classroom_user_info(review["tutor_id"])
                if not status:
                    return False, []
                student_name = f"{user_info.get('first_name','')} {user_info.get('last_name','')}"
                tutor_name = f"{tutor_info.get('first_name','')} {tutor_info.get('last_name','')}"

            formatted_reviews.append({
                "tutor_name": tutor_name,
                "student_name": student_name,
                "rating": review["rating"],
                "comment": review["comment"],
                "creation_date": review["creation_date"],
            })

        return True, formatted_reviews

    except Exception as e:
        return False, str(e)
