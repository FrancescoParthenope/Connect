from config.database import tutor_tests_collection

class TutorTestManager:
    @staticmethod
    def correct_test(test_id, answers_given):
        try:
            test = tutor_tests_collection.find_one({"_id": test_id})
            if not test:
                return False, "Test not found in database"

            tot = 0
            count = 0

            for question in test["questions"]:
                tot += 1
                q_id = question["_id"]
                correct = question["correct_answer"]
                user_answer = answers_given.get(q_id)

                if user_answer == correct:
                    count += 1

            if tot == 0:
                return False, "Test has no questions to evaluate, contact administrator"

            test_result = count/tot * 100
            if test_result >= 85.0:
                return True, f"Tutor test completed with {test_result}%"
            else:
                return False, f"Tutor test failed with {test_result}%"

        except Exception as e:
            return False, f"Error connecting to database : {str(e)}"