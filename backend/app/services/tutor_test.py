import random
from datetime import datetime, timezone, timedelta
from config.database import users_collection, tutor_tests_collection, subjects_collection
from app.services.tutor import TutorProfileManager

# support functions are at the end of the class

class TutorTestManager:

    @staticmethod
    def verify_and_update_test(user_id, subject_id):
        try:
            # recovering the test from the DB
            test = tutor_tests_collection.find_one({"subject_id": subject_id})
            if not test:
                return False, "Test not found in database", "NOT_FOUND"

            user_filter = {
                "_id": user_id,
                "tutor_application": {
                    "$elemMatch" : {
                        "subject_id": test.get("subject_id"),
                        "status": "in_progress"
                    }
                }
            }

            # recovering the filter and saving the position with the .$ positional operator
            user = users_collection.find_one(user_filter, {"tutor_application.$": 1})
            if not user:
                return False, "User not found in database", "NOT_FOUND"

            # checking if the list is populated
            tutor_app = user.get("tutor_application")
            if not tutor_app:
                return False, "Not found the tutor application", "NOT_FOUND"

            # extracting the list
            current_app = tutor_app[0]

            # getting the answer of the student
            answers_given = current_app.get("user_answers")

            # correcting the test
            success, message, status_key = TutorTestManager.__correct_test(test, answers_given)

            # check if the test is completed or failed
            if status_key == "NO_QUESTIONS":
                return success, message, status_key
            else:
                completed_date = datetime.now(timezone.utc)
                if success:
                    status = "completed"
                else:
                    status = "failed"

            # preparing the query for the update at the right position with .$
            query = {
                "$set": {
                    "tutor_application.$.status": status,
                    "tutor_application.$.completed_date": completed_date,
                }
            }

            # doing the update and verifying
            result = users_collection.update_one(user_filter, query)

            if result.matched_count == 0:
                return False, "No pending Tutor Test for the user", "NO_PENDING_TEST"

            if status == "completed":
                # the variable returned from these functions are not used here
                promote_status, promote_message = TutorProfileManager.promote_to_tutor(user_id)
                add_status, add_message = TutorProfileManager.add_subject(user_id, subject_id)
                return True, message, "TEST_PASSED"
            else:
                return True, message, "TEST_FAILED"

        except Exception as e:
            return False, f"Error connecting to database : {str(e)}", "DB_ERROR"

    @staticmethod
    def assign_test_to_student(user_id, subject_id):
        try:
            # recovering the subject name from the database
            subject = subjects_collection.find_one({"_id": subject_id})

            if not subject:
                return False, "Subject not found in database", "NOT_FOUND"

            subject_name = subject.get("name")

            # recovering the questions from the right test
            test_questions = tutor_tests_collection.find_one(
                {"subject_id": subject_id},
                {"_id": 0, "questions": 1}
            )

            if not test_questions:
                return False, "Test not found in database", "NOT_FOUND"

            # using class functions to prepare the test
            # .get() for extracting the dictionary
            # added () to better readability
            test_data_to_give = (
                TutorTestManager.__prepare_and_shuffle_questions(
                    test_questions.get("questions")))

            test_application = {
                "subject_id": subject_id,
                "subject_name": subject_name,
                "status": "pending",
                "assigned_date": datetime.now(timezone.utc),
                "test_data": test_data_to_give,
                "user_answers": [],
            }

            update_filter = {
                "_id": user_id,
                "tutor_application": {
                    "$not": {
                        "$elemMatch": {
                            "subject_id": subject_id,
                            "status": {
                                "$in" : ["pending", "completed", "in_progress"]
                            }
                        }
                    }
                }
            }

            result = users_collection.update_one(update_filter, {
                "$push": {
                    "tutor_application": test_application
                }
            })

            if result.matched_count == 0:
                user_exists = users_collection.find_one({"_id": user_id})
                if not user_exists:
                    return False, "User not found in database", "NOT_FOUND"

                tutor_applications = user_exists.get("tutor_application", [])
                for app in tutor_applications:
                    if app.get("subject_id") == subject_id:
                        status = app.get("status")
                        if status == "completed":
                            return False, "User already a Tutor for this subject", "ALREADY_TUTOR"
                        elif status == "pending":
                            return False, "Tutor Test already exists and is pending", "ALREADY_EXISTS"
                        elif status == "in_progress":
                            return False, "Tutor Test already exists and is in_progress", "IN_PROGRESS"

                return False, "Action not allowed for this user", "BAD_REQUEST"

            return True, "Tutor test assigned successfully", "SUCCESS"

        except Exception as e:
            return False, f"Error connecting to database : {str(e)}", "DB_ERROR"

    @staticmethod
    def get_all_pending_tests(user_id):
        try:
            # searching in db the right user
            # and recovering all the tests with "pending" or "in_progress"
            user_filter = {
                "_id": user_id,
                "tutor_application": {
                    "$elemMatch": {
                        "status": { "$in": ["pending","in_progress"] }
                    }
                }
            }

            pending_tests = users_collection.find_one(user_filter,{"_id": 0, "tutor_application": 1})

            if not pending_tests or "tutor_application" not in pending_tests:
                return False, "No pending or in progress Tutor Test for the user", "NOT_FOUND"

            pending_tests_list = []

            # creating the list to give
            for test in pending_tests.get("tutor_application"):
                status = test.get("status","")
                if status in ["pending", "in_progress"]:
                    subject_id = test.get("subject_id")
                    # taking only the one with the status "pending" or "in_progress"
                    # verify first if an in_progress test is expired
                    if status == "in_progress":
                        time_now = datetime.now(timezone.utc)
                        expire_date = test.get("expire_date")
                        # if is expired we return the result of verify and update test function
                        if time_now >= expire_date:
                            return TutorTestManager.verify_and_update_test(user_id,subject_id)

                    # if it's pending or in progress but not expire we recover the info to pass
                    subject_id = subject_id
                    subject_id_str = str(subject_id) if subject_id else None
                    subject_name = test.get("subject_name")
                    assigned_date = test.get("assigned_date")
                    assigned_status = test.get("status")

                    # appending in the list the dictionary with the info extracted
                    pending_tests_list.append({
                        "subject_id": subject_id_str,
                        "subject_name": subject_name,
                        "assigned_date": assigned_date,
                        "assigned_status": assigned_status
                    })

            return True, pending_tests_list, "SUCCESS"

        except Exception as e:
            return False, f"Error connecting to database : {str(e)}", "DB_ERROR"

    @staticmethod
    def get_all_completed_tests(user_id):
        try:
            # searching the test that are completed or failed
            user_filter = {
                "_id": user_id,
                "tutor_application": {
                    "$elemMatch": {
                        "status": { "$in": ["completed","failed"] }
                    }
                }
            }

            cursor = users_collection.find(user_filter, {"_id": 0, "tutor_application": 1})
            data_to_return = []
            found = False

            for app_doc in cursor:
                for application in app_doc.get("tutor_application", []):
                    if application.get("status") in ["completed","failed"]:
                        found = True
                        data_to_append = {
                            "subject_name" : application.get("subject_name"),
                            "assigned_date": application.get("assigned_date"),
                            "completed_date": application.get("completed_date"),
                            "application_status": application.get("status")
                        }
                        data_to_return.append(data_to_append)

            if found:
                return True, data_to_return, "SUCCESS"

            return False, "No Completed Application Found", "NOT_FOUND"

        except Exception as e:
            return False, f"Error connecting to database : {str(e)}", "DB_ERROR"

    @staticmethod
    def get_test_assigned(user_id, subject_id):
        try:
            # searching in db the right user
            # with subject and status matching the criteria
            user_filter = {
                "_id": user_id,
                "tutor_application": {
                    "$elemMatch": {
                        "subject_id": subject_id,
                        "status": "in_progress"
                    }
                }
            }

            user_application = users_collection.find_one(user_filter, {"_id": 0, "tutor_application.$": 1})

            # checking result of the query and if there is an application in progress
            if not user_application or "tutor_application" not in user_application:
                return False, "No user found or not application found", "NOT_FOUND"

            tutor_application = user_application.get("tutor_application")
            if not tutor_application:
                return False, "Not found the tutor application", "NOT_FOUND"

            right_application = tutor_application[0]

            # extracting the time remaining before the test is expired
            now = datetime.now(timezone.utc)
            expire_date = right_application.get("expire_date")

            time_left = int((expire_date - now).total_seconds())

            # if the call was done after the time is over
            if time_left <= 0:
                return False, "Time to complete the test is expired", "TIME_EXPIRED"

            questions = []
            for q in right_application.get("test_data", []):
                questions.append({
                    "question_id": str(q["question_id"]),
                    "question": q["question"],
                    "answers": q["answers"] # this is an array of {answer_id: int, text: string}
                })

            # recovering if existing the answers already done from the user

            user_answers = []
            for answer in right_application.get("user_answers", []):
                user_answers.append({
                    "question_id": str(answer["question_id"]),
                    "answer": answer["answer_given"]
                })

            output = {
                "subject_id": str(right_application["subject_id"]),
                "subject_name": right_application["subject_name"],
                "time_left_session": time_left,
                "questions": questions,
                "user_answers": user_answers
            }

            return True, output, "SUCCESS"

        except Exception as e:
            return False, f"Error connecting to database : {str(e)}", "DB_ERROR"

    @staticmethod
    def start_test(user_id, subject_id):
        # first we verify with private function if is a pending test
        status, message, status_key = TutorTestManager.__verify_pending(user_id, subject_id)

        if status:
            return status, message, status_key

        #if we are here test was not pending, verifying if is a test in progress
        # we return directly the result of this last check

        status, message, status_key = TutorTestManager.__verify_in_progress(user_id, subject_id)
        return status, message, status_key

    @staticmethod
    def save_single_answer(user_id, subject_id, question_id, answer):
        try:

            user_filter = {
                "_id": user_id,
                "tutor_application": {
                    "$elemMatch": {
                        "subject_id": subject_id,
                        "status": "in_progress"
                    }
                }
            }

            user = users_collection.find_one(user_filter, {"tutor_application.$": 1})

            if not user or not user.get("tutor_application"):
                return False, "No user found or not application found", "NOT_FOUND"

            # there is only 1 element
            current_app = user.get("tutor_application")[0]

            test_data = current_app.get("test_data")
            valid_questions = [ q["question_id"] for q in test_data]

            if question_id not in valid_questions:
                return False, "Question submitted is not in the Test", "BAD_REQUEST"

            if current_app.get("status") != "in_progress":
                return False, "Test is not in progress", "NOT_IN_PROGRESS"

            if datetime.now(timezone.utc) > current_app.get("expire_date"):
                return False, "Test is expired", "EXPIRED"

            # if user changes idea we remove the answer given in the past
            pull_query = {
                "$pull": {
                    "tutor_application.$.user_answers": {
                        "question_id": question_id
                    }
                }
            }

            users_collection.update_one(user_filter, pull_query)

            # we add the new answer in the database
            push_query = {
                "$push": {
                    "tutor_application.$.user_answers": {
                        "question_id": question_id,
                        "answer_given": answer
                    }
                }
            }

            result = users_collection.update_one(user_filter, push_query)

            if result.matched_count > 0:
                return True, "Answer successfully saved", "CREATED"
            else:
                return False, "Answer not saved, Test not in progress ", "NOT_IN_PROGRESS"

        except Exception as e:
            return False, f"Error updating answer in DB : {str(e)}", "DB_ERROR"

    # private functions for the class itself, used __ prefix for name mangling

    @staticmethod
    def __correct_test(test, answers_given):
        tot = 0  # number of questions in the test
        count = 0  # number of correct answers given

        answer_dict = { elem["question_id"]: elem["answer_given"] for elem in (answers_given or []) }

        for question in test.get("questions", []):
            tot += 1
            q_id = question["_id"]
            correct = question["correct_answer"]
            user_answer = answer_dict.get(q_id)

            if user_answer == correct:
                count += 1

            # security check, in case for reasons the test exists but has no questions
        if tot == 0:
            return False, "Test has no questions to evaluate, contact administrator", "NO_QUESTIONS"

        test_result = count / tot * 100
        if test_result >= 85.0:
            return True, f"Congratulation! \nTutor test completed with {test_result}%", "SUCCESS"
        else:
            return False, f"We are sorry! \nTutor test failed with {test_result}%", "FAILED"

    @staticmethod
    def __prepare_and_shuffle_questions(question_list):
        # preparing the single question to add to the output
        test_prepared = []
        for question in (question_list or []):
            to_append = {
                "question_id": question["_id"],
                "question": question["question"],
                "answers": TutorTestManager.__shuffle_answers(question.get("answers", []))
            }
            test_prepared.append(to_append)

        # shuffling the question order
        random.shuffle(test_prepared)
        return test_prepared

    # return answers shuffled
    @staticmethod
    def __shuffle_answers(answers_list):
        if not answers_list:
            return []
        # shuffling the answer list and returning it
        return random.sample(answers_list, len(answers_list))

    @staticmethod
    def __verify_pending(user_id, subject_id):
        try:
            # setting the time of start and the time of finish of the test
            starting_time = datetime.now(timezone.utc)
            expire_date = starting_time + timedelta(minutes=30)

            update_filter = {
                "_id": user_id,
                "tutor_application": {
                    "$elemMatch": {
                        "subject_id": subject_id,
                        "status": "pending"
                    }
                }
            }

            query_filter = {
                "$set": {
                    "tutor_application.$.status": "in_progress",
                    "tutor_application.$.started_date": starting_time,
                    "tutor_application.$.expire_date": expire_date,
                }
            }

            result = users_collection.update_one(update_filter, query_filter)

            # this will check if the test is passed from pending to in_progress
            if result.matched_count > 0:
                return True, "Test is started", "SUCCESS"

            return False, "Test not pending", "NOT_PENDING"

        except Exception as e:
            return False, f"Error connecting to database : {str(e)}", "DB_ERROR"

    @staticmethod
    def __verify_in_progress(user_id, subject_id):
        try:
            user_filter = {
                "_id": user_id,
                "tutor_application": {
                    "$elemMatch": {
                        "subject_id": subject_id,
                        "status": "in_progress"
                    }
                }
            }

            check_in_progress = users_collection.find_one(user_filter, {
                "_id": 0,
                "tutor_application.$": 1,
            })

            if check_in_progress and check_in_progress.get("tutor_application"):
                app = check_in_progress["tutor_application"][0]
                # checking if the test is expired
                expire_date = app.get("expire_date")
                if expire_date and datetime.now(timezone.utc) > expire_date:
                    #if is expired we return the result of verify and update test
                    return TutorTestManager.verify_and_update_test(user_id,subject_id)
                #if not we can continue the test
                return True, "Test is in progress", "IN_PROGRESS"

            return False, "Test cannot be started", "NOT_STARTED"

        except Exception as e:
            return False, f"Error connecting to database : {str(e)}", "DB_ERROR"