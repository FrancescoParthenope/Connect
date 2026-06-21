from bson import ObjectId
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.payments import bp
from config.database import users_collection
from app.services.mockPayment import MockPayment

# WARNING: the payment methods need to change to adapt to effective
# adopt the standard PCI-DSS (security for bank datas)

@bp.route('/payments_methods', methods=['POST'])
@jwt_required()
def add_payments_methods():

    # recovering json data from the request
    data = request.get_json()

    # check presence of all data
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    # get user id form JWT
    user_id = get_jwt_identity()

    # recovering json data from the request
    payment_type = data.get('payment_type', '').strip() # card or paypal
    card_number = data.get('card_number', '')
    cvv = data.get('cvv', '').strip()
    expiration_date = data.get('expiration_date', '').strip()
    provider = data.get('provider', '').strip() # payment provider
    is_default = data.get('is_default', False)

    # check data received
    if not payment_type or not card_number or not cvv or not expiration_date:
        return jsonify({'error': 'missing on obligatory camp'}), 400

    user_filter = {'_id': ObjectId(user_id)}

    result = MockPayment.create_card_token(card_number)

    if result["success"]:
        token = result["token"]
        last_four_digits = result["last_four_digits"]
        to_save = {
            "token_id": token,
            "type": payment_type,
            "expiration_date": expiration_date,
            "provider": provider,
            "last_four_digits": last_four_digits,
            "is_default": is_default
        }
    else:
        return jsonify({
            "success": False,
            "message": result['message']
        }), 400

    try:
        update = {
            "$push":{
                "payment_methods": to_save
            }
        }

        operation_result = users_collection.update_one(user_filter, update)

        if operation_result.modified_count > 0:
            return jsonify({
                'success': True,
                'message': 'payment method added successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'payment method not added'
            }), 404

    except Exception as e:
        # error while inserting the payment method into MongoDB
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500