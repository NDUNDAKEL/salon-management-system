from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from flask_mail import Mail
from flask_cors import CORS
from datetime import timedelta
import os
from dotenv import load_dotenv
from models import db  # Import your db instance

# Load environment variables
load_dotenv()

# Initialize extensions
jwt = JWTManager()
migrate = Migrate()
mail = Mail()
cors = CORS()

def create_app():
    app = Flask(__name__)

    # App configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///salon.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    app.config['MAIL_SERVER'] = 'smtp.gmail.com'
    app.config['MAIL_PORT'] = 587
    app.config['MAIL_USE_TLS'] = True
    app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_USERNAME')
   
    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)
    cors.init_app(app)

    # Register blueprints
    from auth import auth_bp
    from customer import customer_bp
    from stylist import stylist_bp
    from salon import salon_bp
    from admin import admin_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(customer_bp, url_prefix="/api/customer")
    app.register_blueprint(stylist_bp, url_prefix="/api/stylist")
    app.register_blueprint(salon_bp, url_prefix="/api/salon")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    return app

app = create_app()

if __name__ == "__main__":
    app.run(debug=True)
