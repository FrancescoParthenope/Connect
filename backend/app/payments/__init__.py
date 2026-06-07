from flask import Blueprint

# Blueprint for payments
bp = Blueprint('payments', __name__, url_prefix='/api')

from app.payments import routes