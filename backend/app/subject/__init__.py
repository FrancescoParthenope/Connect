from flask import Blueprint

bp = Blueprint('subject', __name__, url_prefix='/api')

from app.subject import routes