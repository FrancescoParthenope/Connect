import random
from datetime import datetime, timedelta, timezone
from bson import ObjectId

from config.database import tests_collection, tests_sessions_collection, tests_submissions_collection, student_tests_collection, users_collection

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
                # Check if the previous attempt has been submitted
                if session["status"] == "submitted":
                    student_test = student_tests_collection.find_one(
                        {
                            "test_id": test_id,
                            "student_id": student_id
                        },
                        sort=[("completed_date", -1)]
                    )

                    if student_test and student_test["status"] == "FAILED":
                        # Allow a new attempt
                        tests_sessions_collection.delete_one({
                            "_id": session["_id"]
                        })
                    else:
                        return False, "Test is already submitted"

                elif datetime.now(timezone.utc) > session["expire_date"]:
                    # Remove expired session
                    tests_sessions_collection.delete_one({
                        "_id": session["_id"]
                    })
                else:
                    # Resume the current session
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

            completed_questions = []

            for answer in answers:
                question = question_map.get(answer['question_id'])

                question_data = {
                    "question_text": question["question"],
                    "score_assigned": answer["score_assigned"],
                }

                if question["question_type"] == "multiple_choice":
                    selected_answer = ""

                    for option in question["answers"]:
                        if option["answer_id"] == answer["given_answer_id"]:
                            selected_answer = option["text"]
                            break
                    question_data["given_answer_text"] = selected_answer
                else:
                    question_data["given_answer_text"] = answer["given_answer"]

                completed_questions.append(question_data)

            open_question = False

            for question in test['questions']:
                if question["question_type"] == "open_answer":
                    open_question = True
                    break

            # Open-answer tests remain in CORRECTION status and do not receive
            # a final score until the tutor completes the manual evaluation
            status = "CORRECTION" if open_question else "COMPLETED"
            final_score = None if open_question else score

            student_tests_collection.insert_one({
                "test_id": test_id,
                "title": test['title'],
                "student_id": student_id,
                "completed_date": datetime.now(timezone.utc),
                "questions": completed_questions,
                "status": status,
                "score": final_score,
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

    @staticmethod
    def get_student_tests(student_id):
        try:
            tests = list(student_tests_collection.find({'student_id': student_id}).sort("completed_date", -1))

            formatted_tests = []

            for test in tests:
                print(test)
                formatted_tests.append({
                    "test_id": str(test["test_id"]),
                    "title": test["title"],
                    "status": test["status"],
                    "score": test["score"],
                    "completed_date": test["completed_date"],
                })

            return True, formatted_tests

        except Exception as e:
            return False, str(e)


    @staticmethod
    def get_tests_to_correct():
        try:

            tests = student_tests_collection.find({ "status": "CORRECTION"}).sort("completed_date", -1)

            formatted_tests = []

            for test in tests:
                student = users_collection.find_one({
                    "_id": ObjectId(test['student_id'])
                })

                if not student:
                    return False, "student not found"

                student_name = f"{student['first_name']} {student['last_name']}"

                formatted_tests.append({
                    "submission_id": str(test["_id"]),
                    "test_id": str(test["test_id"]),
                    "student_id": test["student_id"],
                    "student_name": student_name,
                    "title": test["title"],
                    "completed_date": test["completed_date"],
                    "status": test["status"],
                    "score": test["score"],
                })

            return True, formatted_tests

        except Exception as e:
            return False, str(e)


    @staticmethod
    def get_submission_test(submission_id):
        try:
            submission = student_tests_collection.find_one({
                "_id": submission_id
            })

            if not submission:
                return False, "submission not found"

            student = users_collection.find_one({
                "_id": ObjectId(submission['student_id'])
            })

            if not student:
                return False, "student not found"

            student_name = f"{student['first_name']} {student['last_name']}"

            formatted_submission = {
                "submission_id": str(submission["_id"]),
                "test_id": str(submission["test_id"]),
                "student_id": str(submission["student_id"]),
                "student_name": student_name,
                "title": submission["title"],
                "status": submission["status"],
                "score": submission["score"],
                "completed_date": submission["completed_date"],
                "questions": submission["questions"]
            }

            return True, formatted_submission

        except Exception as e:
            return False, str(e)


    @staticmethod
    def save_correction(data):
        try:
            submission_id = data.get("submission_id")
            questions = data.get("questions")
            status = data.get("status")

            if not submission_id or not questions or not status:
                return False, "submission or questions not found"

            submission = student_tests_collection.find_one({
                "_id": ObjectId(submission_id)
            })

            if not submission:
                return False, "submission not found"

            total_score = 0
            for question in questions:

                index = question["index"]
                score = question["score"]

                submission["questions"][index]["score_assigned"] = score

                total_score += score

                student_tests_collection.update_one(
                    {"_id": ObjectId(submission_id)},
                    {
                        "$set": {
                            "questions": submission["questions"],
                            "score": total_score,
                            "status": status
                        }
                    }
                )

            return True, "Ready to save correction"

        except Exception as e:
            return False, str(e)

    @staticmethod
    def get_corrected_tests():
        try:
            tests = student_tests_collection.find({"status": { "$in": ["COMPLETED", "FAILED"]}}).sort("completed_date", -1)

            formatted_tests = []

            for test in tests:

                student = users_collection.find_one({"_id": ObjectId(test["student_id"]) })

                if not student:
                    return False, "Student not found"

                student_name = f"{student['first_name']} {student['last_name']}"

                formatted_tests.append({
                    "submission_id": str(test["_id"]),
                    "test_id": str(test["test_id"]),
                    "student_id": str(test["student_id"]),
                    "student_name": student_name,
                    "title": test["title"],
                    "completed_date": test["completed_date"],
                    "status": test["status"],
                    "score": test["score"],
                })

            return True, formatted_tests

        except Exception as e:
            return False, str(e)



    @staticmethod
    def get_review_test(test_id, student_id):
        try:
            # retrieve the reviewed test for the current student
            review_test = student_tests_collection.find_one({
                'test_id': ObjectId(test_id),
                'student_id': student_id
            }, sort=[("completed_date", -1)])

            if not review_test:
                return False, "review_test not found"

            review_test["_id"] = str(review_test["_id"])
            review_test["test_id"] = str(review_test["test_id"])

            return True, review_test

        except Exception as e:
            return False, str(e)





