from flask import Blueprint, request, jsonify
from models import db, User, Appointment, Review, SalonReview
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_mail import Message
from app import mail  # ensure `mail` is initialized in your `app.py`
from datetime import datetime
customer_bp = Blueprint("customer_bp", __name__)

# Register a new customer

@customer_bp.route("/customer", methods=["POST"])
def create_customer():
    data = request.get_json()

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    is_admin = data.get("is_admin", False)  # optional, default False

    if not username or not email or not password:
        return jsonify({"error": "Username, email and password are required"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 400

    new_customer = User(
        username=username,
        email=email,
        password=generate_password_hash(password),
        is_admin=is_admin,
        created_at=datetime.utcnow()  # assuming your User model supports this
    )

    db.session.add(new_customer)

    try:
        # Send welcome email
        msg = Message(
            subject="Welcome to Our Salon Booking System",
            recipients=[email],
            body=f"""Hello {username},

Thank you for registering with our salon booking system.
You can now book appointments with our stylists and enjoy our services.

Best regards,  
The Salon Team"""
        )
        mail.send(msg)

        db.session.commit()

        return jsonify({
            "message": "Customer created successfully",
            "customer": {
                "id": new_customer.id,
                "username": new_customer.username,
                "email": new_customer.email,
                "is_admin": new_customer.is_admin,
                "created_at": new_customer.created_at.isoformat()
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to register or send welcome email"}), 500

# Get customer profile
@customer_bp.route("/customers/<int:customer_id>", methods=["GET"])
@jwt_required()
def get_customer(customer_id):
    current_user_id = get_jwt_identity()
    if current_user_id != customer_id:
        return jsonify({"error": "Unauthorized access"}), 403

    customer = User.query.get_or_404(customer_id)
    return jsonify({
        "id": customer.id,
        "username": customer.username,
        "email": customer.email,
        "created_at": customer.created_at
    }), 200

# Update customer profile
@customer_bp.route("/customers/<int:customer_id>", methods=["PATCH"])
@jwt_required()
def update_customer(customer_id):
    current_user_id = int(get_jwt_identity())
    if current_user_id != customer_id:
        return jsonify({"error": "Unauthorized access"}), 403

    customer = User.query.get_or_404(customer_id)
    data = request.get_json()

    if "username" in data:
        if User.query.filter(User.username == data["username"], User.id != customer_id).first():
            return jsonify({"error": "Username already taken"}), 400
        customer.username = data["username"]

    if "is_admin" in data:
        customer.is_admin = data["is_admin"]

    if "email" in data:
        if User.query.filter(User.email == data["email"], User.id != customer_id).first():
            return jsonify({"error": "Email already in use"}), 400
        customer.email = data["email"]

    if "password" in data:
        customer.password = generate_password_hash(data["password"])

    try:
        # Send update email
        msg = Message(
            subject="Your Profile Has Been Updated",
            recipients=[customer.email],
            body=f"""Hello {customer.username},

Your profile information has been successfully updated.

If you didn't make these changes, please contact us immediately.

Best regards,  
The Salon Team"""
        )
        mail.send(msg)

        db.session.commit()
        return jsonify({"message": "Customer updated successfully"}), 200

    except Exception:
        db.session.rollback()
        return jsonify({"error": "Failed to update profile or send email"}), 500

# Delete customer account
@customer_bp.route("/customers/<int:customer_id>", methods=["DELETE"])
@jwt_required()
def delete_customer(customer_id):
    current_user_id = int(get_jwt_identity())
    if current_user_id != customer_id:
        return jsonify({"error": "Unauthorized access"}), 403

    customer = User.query.get_or_404(customer_id)

    Appointment.query.filter_by(customer_id=customer_id).delete()
    Review.query.filter_by(customer_id=customer_id).delete()
    SalonReview.query.filter_by(customer_id=customer_id).delete()

    try:
        msg = Message(
            subject="Your Account Has Been Deleted",
            recipients=[customer.email],
            body=f"""Hello {customer.username},

Your account has been successfully deleted. We're sorry to see you go.

Best regards,  
The Salon Team"""
        )
        mail.send(msg)

        db.session.delete(customer)
        db.session.commit()
        return jsonify({"message": "Customer account deleted successfully"}), 200

    except Exception:
        db.session.rollback()
        return jsonify({"error": "Failed to delete account or send email"}), 500

# Get customer appointments
@customer_bp.route("/customers/<int:customer_id>/appointments", methods=["GET"])
@jwt_required()
def get_customer_appointments(customer_id):
    current_user_id = get_jwt_identity()
    if current_user_id != customer_id:
        return jsonify({"error": "Unauthorized access"}), 403

    appointments = Appointment.query.filter_by(customer_id=customer_id).all()
    return jsonify([{
        "id": app.id,
        "stylist": app.stylist.name,
        "service": app.service.name,
        "appointment_date": app.appointment_date.isoformat(),
        "status": app.status,
        "salon": app.stylist.salon.name
    } for app in appointments]), 200

# Get customer reviews
@customer_bp.route("/customers/<int:customer_id>/reviews", methods=["GET"])
@jwt_required()
def get_customer_reviews(customer_id):
    current_user_id = get_jwt_identity()
    if current_user_id != customer_id:
        return jsonify({"error": "Unauthorized access"}), 403

    stylist_reviews = Review.query.filter_by(customer_id=customer_id).all()
    salon_reviews = SalonReview.query.filter_by(customer_id=customer_id).all()

    return jsonify({
        "stylist_reviews": [{
            "id": rev.id,
            "stylist": rev.stylist.name,
            "rating": rev.rating,
            "comment": rev.comment,
            "created_at": rev.created_at.isoformat()
        } for rev in stylist_reviews],
        "salon_reviews": [{
            "id": rev.id,
            "salon": rev.salon.name,
            "rating": rev.rating,
            "comment": rev.comment,
            "created_at": rev.created_at.isoformat()
        } for rev in salon_reviews]
    }), 200
    
    #create appointments
@customer_bp.route("/customers/<int:customer_id>/appointments", methods=["POST"])
@jwt_required()
def create_appointment(customer_id):
    current_user_id = int(get_jwt_identity())
    if current_user_id != customer_id:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    stylist_id = data.get("stylist_id")
    service_id = data.get("service_id")
    appointment_date = data.get("appointment_date")  # ISO string expected

    if not stylist_id or not service_id or not appointment_date:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        new_appointment = Appointment(
            customer_id=customer_id,
            stylist_id=stylist_id,
            service_id=service_id,
            appointment_date=datetime.fromisoformat(appointment_date),
            status="pending"
        )
        db.session.add(new_appointment)
        db.session.commit()

        return jsonify({"message": "Appointment created successfully"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to create appointment"}), 500
