from flask import Blueprint

bp = Blueprint('review', __name__, url_prefix='/api')

from app.review import routes