import random
from datetime import datetime, timedelta, timezone
from config.database import tests_collection, tests_sessions_collection, tests_submissions_collection

class StudentTestManager:
    @staticmethod
    def start_test(test_id, student_id):
        try:
            test = tests_collection.find_one({'_id': test_id})

            # retrieve the test from the database
            if not test:
                return False, "Test not found in database"

            if not test['is_active']:
                return False, "Test is not active"

            # Check if the student has already started this test
            session = tests_sessions_collection.find_one({
                'test_id': test_id,
                'student_id': student_id
            })

            if session:
                if session["status"] == "submitted":
                    return False, "Test already submitted"

                if datetime.now(timezone.utc) > session["expire_date"]:
                    tests_sessions_collection.delete_one({ "_id": session["_id"] })
                else:
                    return True, {
                        "test_id": str(test_id),
                        "title": test["title"],
                        "time_limit": test["time_limit"],
                        "questions": session["question_order"],
                    }

            question_order = StudentTestManager.prepare_questions(test['questions'])

            started_at = datetime.now(timezone.utc)
            expire_date = started_at + timedelta(minutes=test['time_limit'])

             # Save the new test session
            tests_sessions_collection.insert_one({
                'test_id': test_id,
                'student_id': student_id,
                'question_order': question_order,
                'time_limit': test['time_limit'],
                'started_at': started_at,
                'expire_date': expire_date,
                'status': 'in_progress'
            })

            # Return the test information and ordered questions
            return True,{
                'test_id': str(test_id),
                'title': test['title'],
                'time_limit': test['time_limit'],
                'questions': question_order,
            }

        except Exception as e:
            return False, str(e)


    @staticmethod
    def submit_test(test_id, student_id, answers):
        try:

            session = tests_sessions_collection.find_one({ 'test_id': test_id, 'student_id': student_id })

            if not session:
                return False, "Test not started"

            if session["status"] == "submitted":
                return False, "Test already submitted"

            if datetime.now(timezone.utc) > session["expire_date"] :
                return False, "Text expired"

            test = tests_collection.find_one({'_id': test_id})

            if not test:
                return False, "Test not found in database"

            question_map = {
                str(question["_id"]): question
                for question in test['questions']
            }

            score = 0

            for answer in answers:
                print("CHIAVI QUESTION_MAP:", list(question_map.keys()))
                print("QUESTION ID RICEVUTO:", answer["question_id"])
                
                question = question_map.get(answer['question_id'])

                if not question:
                    return False, "Question not found"

                if question["question_type"] == "multiple_choice":

                    if answer["given_answer_id"] == question["correct_answer"]:
                        answer["score_assigned"] = question["max_score"]
                        answer["evaluation_status"] = 'correct'
                        score += question["max_score"]
                    else:
                        answer["score_assigned"] = 0
                        answer["evaluation_status"] = 'incorrect'
                else:
                    answer["score_assigned"] = None
                    answer["evaluation_status"] = 'pending'

            result = tests_submissions_collection.insert_one({
                'test_id': test_id,
                'student_id': student_id,
                'answers': answers,
                'submit_date': datetime.now(timezone.utc),
                'status': 'submitted',
                'score': score
            })

            tests_sessions_collection.update_one({ 'test_id': test_id, "student_id": student_id }, {"$set": {"status": "submitted"}})

            return True,{
                'submission_id': str(result.inserted_id),
                'score': score
            }
        except Exception as e:
            return False, str(e)


    @staticmethod
    def shuffle_answers(answer_list):
        if not answer_list:
            return []

        answers = list(answer_list)

        random.shuffle(answers)

        return answers

    @staticmethod
    def prepare_questions(question_list):
        prepared_questions = []

        for question in question_list:
            answers = StudentTestManager.shuffle_answers(question.get("answers", []))

            prepared_questions.append({
                "question_id": str(question["_id"]),
                "question_type": question["question_type"],
                "question": question["question"],
                "max_score": question["max_score"],
                "answers": answers,
            })

        random.shuffle(prepared_questions)

        return prepared_questions




