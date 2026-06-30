from bson import ObjectId
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.studentTest import StudentTestManager
from app.test import bp
from config.database import student_tests_collection, users_collection

@bp.route('/student/tests', methods=['GET', 'POST'])
@jwt_required()
def student_test_manager():

    if request.method == 'GET':

        action = request.args.get('action')

        if action == "get_student_test":
            return get_student_test()
        elif action == "get_tests_to_correct":
            return get_tests_to_correct()
        elif action == "get_submission":
            return get_submission()
        elif action == "get_corrected_tests":
            return get_corrected_tests()
        elif action == "get_review_test":
            return get_review_test()

        return jsonify({
            'success': False,
            'message': 'Action not recognized'
        }), 400

    data = request.get_json()

    if not data:
        return jsonify({
            'success': False,
            'message': 'No data provided'
        })

    action = data.get('action')

    if action == 'save_correction':
        return save_correction(data)

    test_id = data.get('test_id')

    if not test_id:
        return jsonify({
            'success': False,
            'message': "Test not found in database"
        }), 400

    test_id = ObjectId(test_id)

    if action == 'start_test':
       return start_test(test_id)
    elif action == 'submit_test':
        return submit_test(test_id, data)

    return jsonify({
        'success': False,
        'message': 'Action not recognized'
    }), 400


#@bp.route('/student/tests', methods=['POST'])
#@jwt_required()
def start_test(test_id):

    # get the authenticated student's ID
    student_id = get_jwt_identity()

    # start the test session
    success, result = StudentTestManager.start_test(test_id, student_id)

    # check for start test session
    if not success:
        return jsonify({
            'success': False,
            'message': result
        }), 400

    # return the test information
    return jsonify({
        'success': True,
        'message': result
    }), 200

#@bp.route('/tests/<test_id>/submit', methods=['POST'])
#@jwt_required()
def submit_test(test_id, data):

    # Extract submitted answers
    answers = data.get('answers', [])

    if not answers:
        return jsonify({
            'success': False,
            'message': 'No answers provided'
        }), 400

    # get student id form JWT
    student_id = get_jwt_identity()

    # submit the authenticated student's ID
    success, result = StudentTestManager.submit_test(test_id, student_id, answers)

    if not success:
        return jsonify({
            'success': False,
            'message': result
        }), 400

    return jsonify({
        'success': True,
        'submission': result['submission_id'],
        'score': result['score']
    }), 201


#@bp.route('/student/tests', methods=['GET'])
#@jwt_required()
def get_student_test():
    student_id = get_jwt_identity()

    success, result = StudentTestManager.get_student_tests(student_id)

    if not success:
        return jsonify({
            'success': False,
            'message': result
        }), 400

    return jsonify({
        'success': True,
        'data': result
    }), 200


#@bp.route('/student/tests', methods=['GET'])
#@jwt_required()
def get_tests_to_correct():

    success, result = StudentTestManager.get_tests_to_correct()

    if not success:
        return jsonify({
            'success': False,
            'message': result
        }), 400

    return jsonify({
        'success': True,
        'data': result
    }), 200


# @bp.route('/student/tests', methods=['GET'])
# @jwt_required()
def get_submission():
    submission_id = request.args.get('submission_id')

    if not submission_id:
        return jsonify({
            'success': False,
            'message': 'No submission_id provided'
        }), 400

    submission_id = ObjectId(submission_id)
    success, result = StudentTestManager.get_submission_test(submission_id)

    if not success:
        return jsonify({
            'success': False,
            'message': result
        }),400

    return jsonify({
        'success': True,
        'data': result
    }), 200


# @bp.route('/student/tests', methods=['POST'])
# @jwt_required()
def save_correction(data):
    success, result = StudentTestManager.save_correction(data)

    if not success:
        return jsonify({
            'success': False,
            'message': result
        }), 400

    return jsonify({
        'success': True,
        'data': result
    }), 200



# @bp.route('/student/tests', methods=['POST'])
# @jwt_required()
def get_corrected_tests():
    success, result = StudentTestManager.get_corrected_tests()

    if not success:
        return jsonify({
            'success': False,
            'message': result
        }),400

    return jsonify({
        'success': True,
        'data': result
    })


# @bp.route('/student/tests', methods=['GET'])
# @jwt_required()
def get_review_test():

    test_id = request.args.get('test_id')
    student_id = get_jwt_identity()

    success, result = StudentTestManager.get_review_test(test_id, student_id)

    if success:
        return jsonify({
            'success': True,
            "data": result
        }), 200

    return jsonify({
        'success': False,
        'message': result
    })
