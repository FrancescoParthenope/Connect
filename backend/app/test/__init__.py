from flask import Blueprint
bp = Blueprint('tests', __name__, url_prefix='/api')

from app.test import routesTest, routesStudentTest

