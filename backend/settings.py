import os

class Setting:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    FRONTEND_URL = os.environ.get('FRONTEND_URL')