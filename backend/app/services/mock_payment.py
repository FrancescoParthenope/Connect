import uuid
import secrets

# This static class with no status is used to imitate stripe functionalities
# it must be deleted when will be implemented real payments functionalities (stripe, PayPal...)
class MockPayment:
    @staticmethod
    def create_card_token(card_number):
        if len(card_number) != 16:
            return {
                "success": False,
                "message": "incorrect length of card number"
            }

        token = f"tok_{secrets.token_hex(12)}"

        last_four_digits = card_number[-4:] if len(card_number) > 4 else "0000"

        return {
            "success" : True,
            "token": token,
            "last_four_digits": last_four_digits,
            "message" : "Card token created successfully"
        }

    @staticmethod
    def simulate_charge(token_id, amount_in_cents):
        if not token_id.startswith("tok_"):
            return {
                "success" : False,
                "message": "incorrect token_id"
            }
        return {
            "success" : True,
            "transaction_id": f"ch_{uuid.uuid4().hex[:14]}",
            "amount_charged": amount_in_cents/100,
            "status": "succeeded",
            "message": "amount successfully charged"
        }