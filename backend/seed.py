from datetime import datetime, timezone
from bson import ObjectId
from config.database import users_collection

def seed_database():
    # first cleaning to avoid duplicates in subsequent tests
    users_collection.delete_many({})

    # creation of a generic student
    student_exemple = {
        "email": "student@exemple.it",
        "password_hash": "$2b$12$eImiTxAk4vmM4...",
        "first_name": "Mario",
        "last_name": "Rossi",
        "birth_date": datetime(2002, 5, 15),
        "profile_picture": "path/to/mario.jpg",
        "bio": "Studente di Informatica in cerca di supporto in Analisi 1.",
        "roles": ["student"],
        "tutor_profile": None,  # not a tutor
        "payment_methods": [
            {
                "token_id": "tok_1N3b8Fca7XyZ9012345678aa",
                "type": "credit_card",
                "provider": "visa",
                "last_four_digit": "4242",
                "expiration_date": "12/28",
                "is_default": True
            }
        ],
        "coins": 50,
        "creation_date": datetime.now(timezone.utc),
        "last_access": datetime.now(timezone.utc)
    }

    # 2. creation of a tutor (with the embedded sub-document)
    tutor_exemple = {
        "email": "tutor@exemple.com",
        "password_hash": "$2b$12$eImiTxAk4vmM4...",
        "first_name": "Chiara",
        "last_name": "Bianchi",
        "birth_date": datetime(1998, 9, 20),
        "profile_picture": "path/to/chiara.jpg",
        "bio": "Laureata magistrale in Matematica, offro ripetizioni.",
        "roles": ["tutor"],
        "tutor_profile": {
            "description": "Specializzata in Analisi Matematica e Geometria.",
            "subjects": [ObjectId()],  # Qui andrebbe l'ID reale della materia preso da SUBJECTS
            "certifications": ["Laurea Magistrale 110L", "Certificazione English C1"],
            "average_rating": 4.8,
            "reviews_count": 12,
            "cv_path": "uploads/cv/chiara_cv.pdf"
        },
        "payment_methods": [
            {
                "token_id": "tok_5K8m2Pba9WvQ1234567890bb",
                "type": "credit_card",
                "provider": "mastercard",
                "last_four_digit": "5555",
                "expiration_date": "08/29",
                "is_default": True
            },
            {
                "token_id": "tok_pp_7J2x9Lzn3Mkp9876543210cc",
                "type": "paypal",
                "provider": "paypal",
                "last_four_digit": "uniparthenope",
                "expiration_date": "N/A",
                "is_default": False
            }
        ],
        "coins": 120,
        "creation_date": datetime.now(timezone.utc),
        "last_access": datetime.now(timezone.utc)
    }

    # Inserts in database
    result_student = users_collection.insert_one(student_exemple)
    result_tutor = users_collection.insert_one(tutor_exemple)

    print(f"Database populated successfully:")
    print(f"ID Student: {result_student.inserted_id}")
    print(f"ID Tutor: {result_tutor.inserted_id}")


if __name__ == "__main__":
    seed_database()