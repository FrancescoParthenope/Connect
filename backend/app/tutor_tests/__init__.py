from flask import Blueprint

bp = Blueprint('tutor_tests', __name__, url_prefix='/api')

from app.tutor_tests import routes