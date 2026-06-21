import os
from datetime import timedelta

class Setting:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    FRONTEND_URL = os.environ.get('FRONTEND_URL')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=int(os.environ.get('JWT_ACCESS_TOKEN_EXPIRES') or 30))