from flask import Blueprint
bp = Blueprint('classroom', __name__, url_prefix='/api')

from app.classroom import routes