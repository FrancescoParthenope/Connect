import random
from datetime import datetime, timezone, timedelta
from config.database import users_collection, tutor_tests_collection, subjects_collection
from app.services.tutor import promote_to_tutor, add_subject

def verify_and_update_test(user_id, subject_id):
    try:
        # will recover the test to correct found by subject
        # since there is only one test for subject to became tutor, subject_id
        # is the only thing need to recover it
        status, payload, status_key = _get_current_tutor_application(
            user_id, subject_id)

        if not status:
            return status, payload, status_key

        answers_given = payload.get("user_answers")

        success, message_correct, status_key = _correct_test(subject_id, answers_given)

        if status_key == "NO_QUESTIONS":
            return success, message_correct, status_key
        else:
            completed_date = datetime.now(timezone.utc)
            if success:
                test_status = "completed"
            else:
                test_status = "failed"

        success, message, status_key = _update_tutor_application(
            user_id, subject_id,test_status,completed_date)

        if test_status == "completed":
            # as the test is completed with success, we directly
            # promote the user to tutor (if it was already one it will do nothing)
            # and we add the subject to the list of the subjects for which he has a certification
            promote_to_tutor(user_id)
            add_subject(user_id, subject_id)
            return True, message_correct, "TEST_PASSED"
        else:
            return True, message_correct, "TEST_FAILED"

    except Exception as e:
        return False, f"Error connecting to database : {str(e)}", "DB_ERROR"


def assign_test_to_student(user_id, subject_id):
    try:
        status, payload, status_key = _build_application(subject_id)
        if not status:
            return status, payload, status_key

        update_filter = {
            "_id": user_id,
            "tutor_application": {
                "$not": {
                    "$elemMatch": {
                        "subject_id": subject_id,
                        "status": {
                            "$in" : ["pending", "completed", "in_progress"]
                        }}}}}

        result = users_collection.update_one(update_filter, {
            "$push": {
                "tutor_application": payload
            }})

        if result.matched_count == 0:
            # this will see if the problems is that there is no user with
            # the user_id passed to the server
            user_exists = users_collection.find_one({"_id": user_id})
            if not user_exists:
                return False, "User not found in database", "NOT_FOUND"

            # if the user exists, we recover the list of his application to see
            # if the problem is that the application itself is already in a status
            # that doesn't include the addition of a new application for that subject
            tutor_applications = user_exists.get("tutor_application", [])
            status, message, status_key = _check_existing_app(subject_id,tutor_applications)
            if not status:
                return status, message, status_key

        return True, "Tutor test assigned successfully", "SUCCESS"

    except Exception as e:
        return False, f"Error connecting to database : {str(e)}", "DB_ERROR"

# this function extracts also the tests in progress
# the name is for when that was not taken in consideration
# will correct the name in a future update

def get_all_pending_tests(user_id):
    try:
        with_status = ["pending","in_progress"]
        status, payload, status_key = _filter_user_applications(user_id,with_status)

        if not status:
            return status, payload, status_key

        status, payload, status_key = _extract_pending_in_progress_apps(user_id,payload.get(
            "tutor_application", []))

        return status, payload, status_key

    except Exception as e:
        return False, f"Error connecting to database : {str(e)}", "DB_ERROR"


def get_all_completed_tests(user_id):
    try:
        with_status = ["completed","failed"]
        status, payload, status_key = _filter_user_applications(user_id,with_status)
        if not status:
            return status, payload, status_key

        return _extract_completed_applications(payload.get("tutor_application", []))

    except Exception as e:
        return False, f"Error connecting to database : {str(e)}", "DB_ERROR"


def get_test_assigned(user_id, subject_id):
    try:
        status,payload,status_key = _get_current_tutor_application(
            user_id, subject_id
        )
        if not status:
            return status, payload, status_key

        now = datetime.now(timezone.utc)
        expire_date = payload.get("expire_date")

        time_left = int((expire_date - now).total_seconds())

        # if the call was done after the time is over
        # we pass the test to the verify and update so it can be corrected
        # we don't want the returns of that function and leave the return tho this one
        if time_left <= 0:
            verify_and_update_test(user_id,subject_id)
            return False, "Time to complete the test is expired", "TIME_EXPIRED"

        questions = []
        for q in payload.get("test_data", []):
            questions.append({
                "question_id": str(q["question_id"]),
                "question": q["question"],
                "answers": q["answers"] # this is an array of {answer_id: int, text: string}
            })

        user_answers = []
        for answer in payload.get("user_answers", []):
            user_answers.append({
                "question_id": str(answer["question_id"]),
                "answer": answer["answer_given"]
            })

        output = {
            "subject_id": str(payload["subject_id"]),
            "subject_name": payload["subject_name"],
            "time_left_session": time_left,
            "questions": questions,
            "user_answers": user_answers
        }

        return True, output, "SUCCESS"

    except Exception as e:
        return False, f"Error connecting to database : {str(e)}", "DB_ERROR"


def start_test(user_id, subject_id):
    status, message, status_key = _verify_pending(user_id, subject_id)

    if status:
        return status, message, status_key

    #if we are here test was not pending, verifying if is a test in progress
    # we return directly the result of this last check

    status, message, status_key = _verify_in_progress(user_id, subject_id)
    return status, message, status_key


def save_single_answer(user_id, subject_id, question_id, answer):
    try:
        status, payload, status_key = _get_current_tutor_application(
            user_id, subject_id)
        if not status:
            return status, payload, status_key

        test_data = payload.get("test_data")

        valid_questions = [ q["question_id"] for q in test_data]

        if question_id not in valid_questions:
            return False, "Question submitted is not in the Test", "BAD_REQUEST"

        if payload.get("status") != "in_progress":
            return False, "Test is not in progress", "NOT_IN_PROGRESS"

        if datetime.now(timezone.utc) > payload.get("expire_date"):
            return False, "Test is expired", "EXPIRED"

        return _save_or_update_answer(
            user_id, subject_id, question_id, answer)

    except Exception as e:
        return False, f"Error updating answer in DB : {str(e)}", "DB_ERROR"

def _correct_test(subject_id, answers_given):
    status, payload, status_key = _get_tutor_test(subject_id)
    if not status:
        return status, payload, status_key

    tot = 0  # number of questions in the test
    count = 0  # number of correct answers given

    # using a dictionary comprehension so we can create the dictionary
    # with the answer associated with the question
    answer_dict = { elem["question_id"]: elem["answer_given"]
                    for elem in (answers_given or []) }

    # in this for we calculate the numbers of the question in the test
    # we also calculate the number of right answers given using the dictionary
    # created before
    for question in payload.get("questions", []):
        tot += 1
        q_id = question["_id"]
        correct = question["correct_answer"]
        user_answer = answer_dict.get(q_id)

        if user_answer == correct:
            count += 1

    if tot == 0:
        return False, "Test has no questions to evaluate, contact administrator", "NO_QUESTIONS"

    test_result = count / tot * 100
    if test_result >= 85.0:
        return True, f"Congratulation! Tutor test completed with {test_result}%", "SUCCESS"
    else:
        return False, f"We are sorry! Tutor test failed with {test_result}%", "FAILED"


def _prepare_and_shuffle_questions(question_list):
    test_prepared = []
    for question in (question_list or []):
        to_append = {
            "question_id": question["_id"],
            "question": question["question"],
            "answers": _shuffle_answers(question.get("answers", []))
        }
        test_prepared.append(to_append)

    random.shuffle(test_prepared)
    return test_prepared

def _shuffle_answers(answers_list):
    if not answers_list:
        return []

    return random.sample(answers_list, len(answers_list))


def _verify_pending(user_id, subject_id):
    try:
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

        if result.matched_count > 0:
            return True, "Test is started", "SUCCESS"

        return False, "Test not pending", "NOT_PENDING"

    except Exception as e:
        return False, f"Error connecting to database : {str(e)}", "DB_ERROR"


def _verify_in_progress(user_id, subject_id):
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
            expire_date = app.get("expire_date")

            if expire_date and datetime.now(timezone.utc) > expire_date:
                return verify_and_update_test(user_id,subject_id)

            return True, "Test is in progress", "IN_PROGRESS"

        return False, "Test cannot be started", "NOT_STARTED"

    except Exception as e:
        return False, f"Error connecting to database : {str(e)}", "DB_ERROR"


def _get_current_tutor_application(user_id, subject_id):
    application = {
        "_id": user_id,
        "tutor_application": {
            "$elemMatch": {
                "subject_id": subject_id,
                "status": "in_progress"
            }
        }
    }

    user = users_collection.find_one(application, {"tutor_application.$": 1})
    if not user:
        return False, "User not found in database", "NOT_FOUND"

    tutor_app = user.get("tutor_application")
    if not tutor_app:
        return False, "Not found the tutor application", "NOT_FOUND"

    return True, tutor_app[0], "SUCCESS"


def _get_tutor_test(subject_id):
    test = tutor_tests_collection.find_one({"subject_id": subject_id})

    if not test:
        return False, f"Test not found in database", "NOT_FOUND"

    return True, test,"SUCCESS"


def _update_tutor_application(user_id, subject_id,status, completed_date):
    application = {
        "_id": user_id,
        "tutor_application": {
            "$elemMatch": {
                "subject_id": subject_id,
                "status": "in_progress"
            }
        }
    }

    query = {
        "$set": {
            "tutor_application.$.status": status,
            "tutor_application.$.completed_date": completed_date,
        }
    }

    result = users_collection.update_one(application, query)

    if result.matched_count == 0:
        return False, "No pending Tutor Test for the user", "NO_PENDING_TEST"

    return True, "Update done successfully", "SUCCESS"


def _build_application(subject_id):
    subject = subjects_collection.find_one({"_id": subject_id})

    if not subject:
        return False, "Subject not found in database", "NOT_FOUND"

    subject_name = subject.get("name")

    status, test, status_key = _get_tutor_test(subject_id)
    if not status:
        return False, "Test not found in database", "NOT_FOUND"

    test_questions = test.get("questions")

    if not test_questions:
        return False, "Questions not found in the test", "NOT_FOUND"

    test_data_to_give = _prepare_and_shuffle_questions(test_questions)

    test_application = {
        "subject_id": subject_id,
        "subject_name": subject_name,
        "status": "pending",
        "assigned_date": datetime.now(timezone.utc),
        "test_data": test_data_to_give,
        "user_answers": [],
    }

    return True, test_application, "SUCCESS"


def _check_existing_app(subject_id,applications):
    for app in applications:
        if app.get("subject_id") == subject_id:
            status = app.get("status")
            if status == "completed":
                return False, "User already a Tutor for this subject", "ALREADY_TUTOR"
            elif status == "pending":
                return False, "Tutor Test already exists and is pending", "ALREADY_EXISTS"
            elif status == "in_progress":
                return False, "Tutor Test already exists and is in_progress", "IN_PROGRESS"

    return False, "Action not allowed for this user", "BAD_REQUEST"


def _filter_user_applications(user_id,test_status):
    user_filter = {
        "_id": user_id,
        "tutor_application": {
            "$elemMatch": {
                "status": {"$in": test_status}
            }
        }
    }

    tests = users_collection.find_one(user_filter, {"_id": 0, "tutor_application": 1})

    if not tests or "tutor_application" not in tests:
        return False, "No Tutor tests found with the right status", "NOT_FOUND"

    return True, tests, "SUCCESS"


def _extract_pending_in_progress_apps(user_id,applications):
    applications_list = []

    for app in applications:
        status = app.get("status", "")
        if status in ["pending", "in_progress"]:
            subject_id = app.get("subject_id")
            # taking only the one with the status "pending" or "in_progress"
            # verify first if an in_progress test is expired
            # an in progress test must have the expiration date
            if status == "in_progress":
                time_now = datetime.now(timezone.utc)
                expire_date = app.get("expire_date")
                if time_now >= expire_date:
                    verify_and_update_test(user_id, subject_id)
                    continue

            subject_id_str = str(subject_id) if subject_id else None
            subject_name = app.get("subject_name")
            assigned_date = app.get("assigned_date")
            assigned_status = app.get("status")

            applications_list.append({
                "subject_id": subject_id_str,
                "subject_name": subject_name,
                "assigned_date": assigned_date,
                "assigned_status": assigned_status
            })
    if applications_list:
        return True, applications_list, "SUCCESS"
    return False, "No Tutor applications found with the right status", "NOT_FOUND"


def _extract_completed_applications(applications):
    # we prepare an empty list to add the applications found and will use it
    # to return to frontend. Using also a boolean variable to
    # better be sure of the right things to return
    data_to_return = []
    found = False

    for application in applications:
        if application.get("status") in ["completed", "failed"]:
            found = True
            data_to_append = {
                "subject_name": application.get("subject_name"),
                "assigned_date": application.get("assigned_date"),
                "completed_date": application.get("completed_date"),
                "application_status": application.get("status")
            }
            data_to_return.append(data_to_append)

    if found:
        return True, data_to_return, "SUCCESS"

    return False, "No Completed Application Found", "NOT_FOUND"


def _save_or_update_answer(user_id,subject_id,question_id, answer):
    user_filter = {
        "_id": user_id,
        "tutor_application": {
            "$elemMatch": {
                "subject_id": subject_id,
                "status": "in_progress"
            }
        }
    }
    # as MongoDb does not refresh an answer precedently given
    # we first remove it before inserting the new one
    # so we do a double update_one
    pull_query = {
        "$pull": {
            "tutor_application.$.user_answers": {
                "question_id": question_id
            }
        }
    }

    users_collection.update_one(user_filter, pull_query)

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