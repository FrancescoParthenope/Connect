from flask import Blueprint

# Blueprint for test

bp = Blueprint('chat', __name__, url_prefix='/api')

from app.chat import routes_chat