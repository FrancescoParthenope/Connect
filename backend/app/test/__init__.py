from flask import Blueprint

# Blueprint for test

bp = Blueprint('tests', __name__, url_prefix='/api')

from app.test import routerTest, routesStudentTest

