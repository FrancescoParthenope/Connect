from flask import jsonify

error_map = {
    "BAD_REQUEST": 400,
    "UNAUTHORIZED": 401,
    "NOT_FOUND": 404,
    "NO_PENDING_TEST": 404,
    "NOT_STARTED": 404,
    "ALREADY_EXISTS": 409, # Conflict
    "ALREADY_TUTOR": 409,
    "IN_PROGRESS": 409,
    "TIME_EXPIRED": 410, # Gone (resource will never be accessible again)
    "NO_QUESTIONS": 422, # unprocessable entity
    "DB_ERROR": 500
}

success_map = {
    "SUCCESS": 200,
    "IN_PROGRESS": 200,
    "TEST_PASSED": 200,
    "TEST_FAILED": 200,
    "CREATED": 201
}

def create_route_response(status, data_or_message, status_key="SUCCESS"):
    if not status:
        error_code = error_map.get(status_key,400)
        return jsonify({
            "status": status,
            "message": data_or_message,
        }), error_code

    success_code = success_map.get(status_key,200)
    return jsonify({
        "status": status,
        "message": data_or_message,
    }), success_code