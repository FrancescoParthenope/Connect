from flask import Blueprint

# Blueprint for user
bp = Blueprint('user', __name__, url_prefix='/api')

from app.user import routes