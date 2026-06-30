from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from app.test import bp
from config.database import tests_collection, users_collection

@bp.route('/tests', methods=['GET', 'POST'])
@jwt_required()
def tests_manager():

    if request.method == 'GET':

        test_id = request.args.get('test_id')
        classroom_id = request.args.get('classroom_id')

        if test_id:
            return get_test(test_id)
        elif classroom_id:
            return get_classroom_tests(classroom_id)

        return jsonify({
            'success': False,
            'message': "Specify test_id or classroom_id"
        }), 400

    elif request.method == 'POST':

        data = request.get_json()

        if not data:
            return jsonify({
                'success': False,
                'message': "No data provided"
            }), 400

        action = data.get('action')

        if action == 'create_test':
            return create_test()
        elif action == 'toggle_test':
            return toggle_test()

        return jsonify({
            'success': False,
            'message': "Invalid action"
        }), 400


#@bp.route('/tests', methods=['POST'])
#@jwt_required()
def create_test():

    # recovering json data from the request
    data = request.get_json()

    # check presence of all data
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # get user id form JWT
    user_id = ObjectId(get_jwt_identity())

    user = users_collection.find_one({'_id': user_id})

    if not user:
        return jsonify({
            'success': False,
            'message': "User not found"
        }), 404

    user = user['first_name'] + ' ' + user['last_name']

    # extract test information
    title = data.get('title').strip()
    classroom_id = data.get('classroom_id')
    questions = data.get('questions', [])
    time_limit = data.get('time_limit', 60)

    # validate required fields
    if not title or not classroom_id or len(questions) == 0:
        return jsonify({
            'success': False,
            'message': "No required data provided"
        }), 400

    #  create test document
    test_document = {
        'title': title,
        'classroom_id': classroom_id,
        'creator_id': user_id,
        'creator_name': user,
        'questions': questions,
        'time_limit': time_limit,
        'is_active': False
    }

    try:
         result = tests_collection.insert_one(test_document)
         test_id = str(result.inserted_id)

         return jsonify({
             'success': True,
             'test_id': test_id
         }), 201

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e),
        }), 500


#@bp.route('/tests/<test_id>', methods=['GET'])
#@jwt_required()
def get_test(test_id):

    # search the test in MongoDB
    test = tests_collection.find_one({'_id': ObjectId(test_id)})

    # check if the test exists
    if not test:
        return jsonify({
            'success': False,
            'message': "Test not found"
        }), 404

    # convert MongoDB id to string, so they can be returned as JSON
    test['_id'] = str(test['_id'])
    test['creator_id'] = str(test['creator_id'])
    test['classroom_id'] = str(test['classroom_id'])

    # convert question in string
    for question in test['questions']:
        question['_id'] = str(question['_id'])

    # return the requested test
    return jsonify({
        'success': True,
        'data': test
    }), 200


#@bp.route('/classroom/<classroom_id>/tests', methods=['GET'])
#@jwt_required()
def get_classroom_tests(classroom_id):

    try:
        # retrieve all test associated with the selected classroom
        tests = list(
            tests_collection.find({ 'classroom_id' : classroom_id}))

        # create a simplified response object
        formatted_test = []

        for test in tests:
            # basic test information
            formatted_test.append({
                # convert MongoDB into string
                'test_id': str(test['_id']),
                'title': test['title'],
                'time_limit': test['time_limit'],
                'is_active': test['is_active']
            })

        # return all classroom test
        return jsonify({
            'success': True,
            'data': formatted_test
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e),
        }), 500



def toggle_test():

    data = request.get_json()

    if not data:
        return jsonify({
            'success': False,
            'message': "No data provided"
        }), 400

    test_id = data.get('test_id')
    is_active = data.get('is_active')

    if test_id is None or is_active is None:
        return jsonify({
            'success': False,
            'message': "Missing required data"
        }), 400

    try:
        result = tests_collection.update_one({'_id': ObjectId(test_id)}, {'$set': {'is_active': is_active}})

        if result.modified_count == 0:
            return jsonify({
                'success': False,
                'message': "Test not found"
            }), 404

        return jsonify({
            'success': True,
            'message': "Test updated successfully"
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e),
        })

