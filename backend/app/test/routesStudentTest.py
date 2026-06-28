from bson import ObjectId
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.studentTest import StudentTestManager
from app.test import bp

@bp.route('/student/tests', methods=['POST'])
@jwt_required()
def student_test_manager():
    data = request.get_json()

    if not data:
        return jsonify({
            'success': False,
            'message': 'No data provided'
        })

    action = data.get('action')
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


