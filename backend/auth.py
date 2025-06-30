from flask import Blueprint, current_app, request, jsonify
from models import db, User, TokenBlocklist,Stylist
from werkzeug.security import check_password_hash
from datetime import timedelta
from flask_jwt_extended import (
    create_access_token, jwt_required,
    get_jwt_identity, get_jwt
)
from flask_mail import Message
from app import mail  # Make sure `mail` is initialized in app.py or __init__.py
from datetime import datetime, timezone

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    print("MAIL_USERNAME:", current_app.config.get('MAIL_USERNAME'))
    print("MAIL_PASSWORD:", current_app.config.get('MAIL_PASSWORD'))
    
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"error": "Username, email and password are required"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    new_user = User(username=username, email=email)
    new_user.set_password(password)

    db.session.add(new_user)

    try:
        # Send welcome email
        msg = Message(
            subject="Welcome to Our Salon Booking System",
            recipients=[email],
            body=f"""Hello {username},

Thank you for registering with our salon booking system.
You can now log in and start booking your favorite services.

Best regards,
The Salon Team
"""
        )
        mail.send(msg)

        db.session.commit()

        return jsonify({
            "message": "User created successfully",
            "user": {
                "id": new_user.id,
                "username": new_user.username,
                "email": new_user.email
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to register or send welcome email"}), 500


@auth_bp.route('/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid credentials"}), 401

    if user.is_blocked:
        return jsonify({"error": "Your account has been blocked. Please contact support."}), 403

    access_token = create_access_token(
        identity=str(user.id),
        expires_delta=timedelta(hours=1),
        additional_claims={
            'is_admin': user.is_admin,
            'is_stylist': user.is_stylist
        }
    )

    # Base user response
    user_data = {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "is_admin": user.is_admin,
        "is_stylist": user.is_stylist
    }

    # Include stylist info if applicable
    if user.is_stylist:
        stylist = Stylist.query.filter_by(email=user.email).first()
        if stylist:
            user_data["stylist_id"] = stylist.id
            user_data["stylist_info"] = {
                "name": stylist.name,
                "salon_id": stylist.salon_id,
                "specialization": stylist.specialization,
                "bio": stylist.bio,
                "phone": stylist.phone
            }

    return jsonify({
        "access_token": access_token,
        "user": user_data
    }), 200

@auth_bp.route("/current_user", methods=["GET"])
@jwt_required()
def fetch_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    user_data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "is_admin": user.is_admin,
        "is_blocked": user.is_blocked,
        "created_at": user.created_at
    }
    return jsonify(user_data), 200


@auth_bp.route("/logout", methods=["DELETE"])
@jwt_required()
def logout():
    try:
        jti = get_jwt()["jti"]
        now = datetime.now(timezone.utc)
        
        # Check if token is already blacklisted
        existing = TokenBlocklist.query.filter_by(jti=jti).first()
        if existing:
            return jsonify({"message": "Token already invalidated"}), 200
            
        new_blocked_token = TokenBlocklist(jti=jti, created_at=now)
        db.session.add(new_blocked_token)
        db.session.commit()
        return jsonify({"message": "Successfully logged out"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 422
