from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from settings import Setting

app = Flask("Connect")
app.config.from_object(Setting)

#configuring CORS (Cross-Origin-Resource-Sharing) to let know who can comunicate with the server
frontend_url = app.config.get('FRONTEND_URL')
CORS(app, origins=[frontend_url])

jwt = JWTManager(app)

from app.auth import bp as auth_bp
from app.payments import bp as payment_bp
from app.user import bp as user_bp
from app.tutor_tests import bp as tutor_tests_bp
from app.test import bp as test_bp
from app.subject import bp as subject_bp
from app.classroom import bp as classroom_bp
from app.chat import bp as chat_bp
app.register_blueprint(auth_bp)
app.register_blueprint(payment_bp)
app.register_blueprint(user_bp)
app.register_blueprint(tutor_tests_bp)
app.register_blueprint(test_bp)
app.register_blueprint(subject_bp)
app.register_blueprint(classroom_bp)
app.register_blueprint(chat_bp)