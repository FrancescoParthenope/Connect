from flask import Blueprint

bp = Blueprint('payments', __name__, url_prefix='/api')

from app.payments import routes