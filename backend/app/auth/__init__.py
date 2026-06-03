from flask import Blueprint

# preparing the blueprint for the authentication
bp = Blueprint('auth', __name__, url_prefix='/api')

from app.auth import routes