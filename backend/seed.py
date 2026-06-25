from bson import ObjectId
from config.database import users_collection, subjects_collection, tutor_tests_collection

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

def clear_users():
    # first cleaning to avoid duplicates in subsequent tests
    users_collection.delete_many({})



if __name__ == "__main__":
    clear_subjects()
    clear_tutor_tests()
    clear_users()

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