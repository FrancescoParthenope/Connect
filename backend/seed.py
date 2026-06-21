from datetime import datetime, timezone
from bson import ObjectId
from config.database import users_collection, subjects_collection, tutor_tests_collection

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

def add_db_subject(subject_name, field_name):
    subject = subject_name
    field = field_name

    to_add = {
        "name": subject,
        "field": field
    }

    result = subjects_collection.insert_one(to_add)

    print(f"Subject successfully added: {result.inserted_id}")

    return result.inserted_id

def add_tutor_test(subject_id, questions_list):
    to_add = {
        "subject_id": subject_id,
        "questions": []
    }

    for q in questions_list:
        to_add["questions"].append({
            "_id": ObjectId(),
            "question": q["question"],
            "answers": [
                {"answer_id": i, "text": text}
                for i, text in enumerate(q["answers"])
            ],
            "correct_answer": q["correct_answer"]
        })

    result = tutor_tests_collection.insert_one(to_add)
    print(f"Tutor Test successfully added for subject ID: {subject_id} ({result.inserted_id})")

def clear_subjects():
    subjects_collection.delete_many({})

def clear_tutor_tests():
    tutor_tests_collection.delete_many({})

if __name__ == "__main__":
    clear_subjects()
    clear_tutor_tests()

    id_analysis = add_db_subject("Analisi Matematica I", "Matematica")
    questions_analysis = [
        {
            "question": "Qual è il limite di sin(x)/x per x che tende a 0?",
            "answers": ["Non esiste", "0", "1", "Infinito"],
            "correct_answer": 2
        },
        {
            "question": "La derivata di e^(2x) è:",
            "answers": ["e^(2x)", "2e^(2x)", "2x*e^(2x-1)", "1/2 e^(2x)"],
            "correct_answer": 1
        }
    ]
    add_tutor_test(id_analysis, questions_analysis)

    id_asd = add_db_subject("Algoritmi e Strutture Dati", "Informatica")
    questions_asd = [
        {
            "question": "Qual è la complessità computazionale del QuickSort nel caso medio?",
            "answers": ["O(n)", "O(n log n)", "O(n^2)", "O(1)"],
            "correct_answer": 1
        },
        {
            "question": "Quale struttura dati segue la logica LIFO (Last In First Out)?",
            "answers": ["Coda (Queue)", "Albero (Tree)", "Pila (Stack)", "Grafo (Graph)"],
            "correct_answer": 2
        }
    ]
    add_tutor_test(id_asd, questions_asd)

    id_philosophy = add_db_subject("Filosofia Classica", "Scienze Umane")
    questions_philosophy = [
        {
            "question": "Chi è l'autore del celebre 'Mito della Caverna'?",
            "answers": ["Aristotele", "Socrate", "Platone", "Epicuro"],
            "correct_answer": 2
        }
    ]
    add_tutor_test(id_philosophy, questions_philosophy)

    id_economy = add_db_subject("Economia Aziendale", "Economia")
    questions_economy = [
        {
            "question": "Cosa rappresenta l'attivo nello Stato Patrimoniale?",
            "answers": ["I debiti aziendali", "Gli investimenti e le risorse a disposizione", "I ricavi delle vendite",
                        "Il patrimonio netto"],
            "correct_answer": 1
        }
    ]
    add_tutor_test(id_economy, questions_economy)