from flask import Flask
from flask_cors import CORS
from settings import Setting

app = Flask("Connect")
app.config.from_object(Setting)

#configuring CORS (Cross-Origin-Resource-Sharing) to let know who can comunicate with the server
frontend_url = app.config.get('FRONTEND_URL')
CORS(app, origins=[frontend_url])

# blueprints registration
# authentication
from app.auth import bp as auth_bp
app.register_blueprint(auth_bp)