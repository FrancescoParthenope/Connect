from flask import Flask
from settings import Setting

app = Flask("Connect")
app.config.from_object(Setting)

# blueprints registration
# authentication
from app.auth import bp as auth_bp
app.register_blueprint(auth_bp)