from flask import Blueprint, request, jsonify
from models import db, User, Stylist, Appointment, Review, SalonReview
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_mail import Message
from app import mail
from datetime import datetime
from flask_cors import CORS

customer_bp = Blueprint("customer_bp", __name__)

def check_admin_or_self_access(customer_id):
    """Check if current user is admin or the requested user"""
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    return current_user.is_admin or current_user_id == customer_id

# ====================== ADMIN-ONLY FUNCTIONS ======================

@customer_bp.route("/admin/customers", methods=["GET"])
@jwt_required()
def admin_get_all_customers():
    current_user = User.query.get(get_jwt_identity())
    if not current_user or not current_user.is_admin:
        return jsonify({"error": "Admin access required"}), 403

    customers = User.query.filter_by(is_admin=False).all()

    return jsonify([
        {
            "id": c.id,
            "username": c.username,
            "email": c.email,
            "phone": c.phone if c.phone is not None else None,
            "profile_pic": c.profile_pic if c.profile_pic is not None else None,
            "is_admin": c.is_admin,
            "is_blocked": c.is_blocked,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "last_login": c.last_login.isoformat() if c.last_login else None,
        } for c in customers
    ]), 200

@customer_bp.route("/admin/customers/<int:customer_id>", methods=["GET"])
@jwt_required()
def admin_get_customer_details(customer_id):
    """Admin: Get specific customer details"""
    current_user = User.query.get(get_jwt_identity())
    if not current_user.is_admin:
        return jsonify({"error": "Admin access required"}), 403

    customer = User.query.get_or_404(customer_id)
    return jsonify({
        "id": customer.id,
        "username": customer.username,
        "email": customer.email,
        "is_admin": customer.is_admin,
        "created_at": customer.created_at.isoformat()
    }), 200

@customer_bp.route("/admin/customers/<int:customer_id>", methods=["PATCH"])
@jwt_required()
def admin_update_customer(customer_id):
    """Admin: Update any customer's details"""
    current_user = User.query.get(get_jwt_identity())
    if not current_user.is_admin:
        return jsonify({"error": "Admin access required"}), 403

    customer = User.query.get_or_404(customer_id)
    data = request.get_json()

    if "is_admin" in data:
        customer.is_admin = data["is_admin"]
    if "is_blocked" in data:
        customer.is_blocked = data["is_blocked"]
    if "username" in data:
        if User.query.filter(User.username == data["username"], User.id != customer_id).first():
            return jsonify({"error": "Username already taken"}), 400
        customer.username = data["username"]
    if "email" in data:
        if User.query.filter(User.email == data["email"], User.id != customer_id).first():
            return jsonify({"error": "Email already in use"}), 400
        customer.email = data["email"]
    if "new_password" in data:
        customer.password = generate_password_hash(data["new_password"])

    try:
        db.session.commit()
        return jsonify({"message": "Customer updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
    # get all appointments admin
@customer_bp.route("/admin/appointments", methods=["GET"])
@jwt_required()
def get_all_appointments_admin():
    current_user = User.query.get(get_jwt_identity())
    if not current_user or not current_user.is_admin:
        return jsonify({"error": "Admin access required"}), 403

    appointments = Appointment.query.all()
    return jsonify([{
        "id": app.id,
        "stylist": getattr(app.stylist, 'name', None),
        "service": getattr(app.service, 'name', None),
        "status": app.status,
        "salon": getattr(getattr(app.stylist, 'salon', None), 'name', None),
        "appointment_date": app.appointment_date.isoformat() if app.appointment_date else None,
        "appointment_time": app.appointment_time.strftime('%H:%M:%S') if app.appointment_time else None,
        "start_datetime": app.start_datetime.isoformat() if app.start_datetime else None,
        "end_datetime": app.end_datetime.isoformat() if app.end_datetime else None
    } for app in appointments]), 200

@customer_bp.route("/admin/customers/<int:customer_id>/appointments", methods=["GET"])
@jwt_required()
def admin_get_customer_appointments(customer_id):
    """Admin: Get any customer's appointments"""
    current_user = User.query.get(get_jwt_identity())
    if not current_user.is_admin:
        return jsonify({"error": "Admin access required"}), 403

    appointments = Appointment.query.filter_by(customer_id=customer_id).all()
    return jsonify([{
        "id": app.id,
        "stylist": getattr(app.stylist, 'name', None),
        "service": getattr(app.service, 'name', None),
        "status": app.status,
        "salon": getattr(getattr(app.stylist, 'salon', None), 'name', None),
        "appointment_date": app.appointment_date.isoformat() if app.appointment_date else None,
        "appointment_time": app.appointment_time.strftime('%H:%M:%S') if app.appointment_time else None,
        "start_datetime": app.start_datetime.isoformat() if app.start_datetime else None,
        "end_datetime": app.end_datetime.isoformat() if app.end_datetime else None
    } for app in appointments]), 200

# ====================== CUSTOMER FUNCTIONS ======================
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


# Delete any appointment (admin only)
@customer_bp.route("/admin/appointments/<int:appointment_id>", methods=["DELETE"])
@jwt_required()
def admin_delete_appointment(appointment_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)

    if not current_user or not current_user.is_admin:
        return jsonify({"error": "Admin access required"}), 403

    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404

    try:
        db.session.delete(appointment)
        db.session.commit()
        return jsonify({"message": "Appointment deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500


# Get all appointments (admin only)

@customer_bp.route("/customers/admin/appointments", methods=["GET"])

def get_customer_appointments_admin():
    

    appointments = Appointment.query.all()

    result = []
    for app in appointments:
        # Safest possible date/time formatting
        def safe_date_format(d):
            if not d:
                return None
            try:
                if isinstance(d, str):
                    return d.split()[0]  # Just get date part if it's a full datetime string
                return d.strftime('%Y-%m-%d')
            except Exception:
                return None

        def safe_time_format(t):
            if not t:
                return None
            try:
                if isinstance(t, str):
                    if ':' in t:  # Basic check if it's a time string
                        return t.split('T')[-1].split('.')[0]  # Handle ISO strings
                    return None
                return t.strftime('%H:%M:%S')
            except Exception:
                return None

        def safe_datetime_format(dt):
            if not dt:
                return None
            try:
                if isinstance(dt, str):
                    return dt  # Assume it's already properly formatted
                return dt.isoformat()
            except Exception:
                return None

        appointment_data = {
            "id": app.id,
            "stylist": getattr(app.stylist, 'name', None),
            "service": getattr(app.service, 'name', None),
            "status": app.status,
            "salon": getattr(getattr(app.stylist, 'salon', None), 'name', None),
            "appointment_date": safe_date_format(getattr(app, 'appointment_date', None)),
            "appointment_time": safe_time_format(getattr(app, 'appointment_time', None)),
            "start_datetime": safe_datetime_format(getattr(app, 'start_datetime', None)),
            "end_datetime": safe_datetime_format(getattr(app, 'end_datetime', None))
        }

        result.append(appointment_data)

    return jsonify(result), 200


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

#update
@customer_bp.route("/customers/<int:customer_id>", methods=["PATCH"])
@jwt_required()
def update_customer(customer_id):
    current_user_id = int(get_jwt_identity())
    if current_user_id != customer_id:
        return jsonify({"error": "Unauthorized access"}), 403

    customer = User.query.get_or_404(customer_id)
    data = request.get_json()

    # Username update
    if "username" in data:
        if User.query.filter(User.username == data["username"], User.id != customer_id).first():
            return jsonify({"error": "Username already taken"}), 400
        customer.username = data["username"]

    # Email update
    if "email" in data:
        if User.query.filter(User.email == data["email"], User.id != customer_id).first():
            return jsonify({"error": "Email already in use"}), 400
        customer.email = data["email"]

    # is_admin update
    if "is_admin" in data:
        customer.is_admin = data["is_admin"]

    # Password update (requires current_password and new_password)
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if current_password or new_password:
        if not (current_password and new_password):
            return jsonify({"error": "Both current and new passwords are required"}), 400

        if not check_password_hash(customer.password, current_password):
            return jsonify({"error": "Current password is incorrect"}), 400

        customer.password = generate_password_hash(new_password)

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

# Delete customer account (self or admin)
@customer_bp.route("/customers/<int:customer_id>", methods=["DELETE"])
@jwt_required()
def delete_customer(customer_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)

    if not current_user:
        return jsonify({"error": "User not found"}), 404

    # Allow if the user is deleting themselves or is an admin
    if current_user_id != customer_id and not current_user.is_admin:
        return jsonify({"error": "Unauthorized access"}), 403

    customer = User.query.get_or_404(customer_id)

    # Delete related data
    Appointment.query.filter_by(customer_id=customer_id).delete()
    Review.query.filter_by(customer_id=customer_id).delete()
    SalonReview.query.filter_by(customer_id=customer_id).delete()

    try:
        # Send deletion email
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
    current_user_id = int(get_jwt_identity())
    if current_user_id != customer_id:
        return jsonify({"error": "Unauthorized access"}), 403

    appointments = Appointment.query.filter_by(customer_id=customer_id).all()

    result = []
    for app in appointments:
        # Safest possible date/time formatting
        def safe_date_format(d):
            if not d:
                return None
            try:
                if isinstance(d, str):
                    return d.split()[0]  # Just get date part if it's a full datetime string
                return d.strftime('%Y-%m-%d')
            except Exception:
                return None

        def safe_time_format(t):
            if not t:
                return None
            try:
                if isinstance(t, str):
                    if ':' in t:  # Basic check if it's a time string
                        return t.split('T')[-1].split('.')[0]  # Handle ISO strings
                    return None
                return t.strftime('%H:%M:%S')
            except Exception:
                return None

        def safe_datetime_format(dt):
            if not dt:
                return None
            try:
                if isinstance(dt, str):
                    return dt  # Assume it's already properly formatted
                return dt.isoformat()
            except Exception:
                return None

        appointment_data = {
            "id": app.id,
            "stylist": getattr(app.stylist, 'name', None),
            "service": getattr(app.service, 'name', None),
            "status": app.status,
            "salon": getattr(getattr(app.stylist, 'salon', None), 'name', None),
            "appointment_date": safe_date_format(getattr(app, 'appointment_date', None)),
            "appointment_time": safe_time_format(getattr(app, 'appointment_time', None)),
            "start_datetime": safe_datetime_format(getattr(app, 'start_datetime', None)),
            "end_datetime": safe_datetime_format(getattr(app, 'end_datetime', None))
        }

        result.append(appointment_data)

    return jsonify(result), 200


#delete appointment
@customer_bp.route("/customers/<int:customer_id>/appointments/<int:appointment_id>", methods=["DELETE"])
@jwt_required()
def delete_customer_appointment(customer_id, appointment_id):
    current_user_id = int(get_jwt_identity())
    if current_user_id != customer_id:
        return jsonify({"error": "Unauthorized access"}), 403

    appointment = Appointment.query.filter_by(id=appointment_id, customer_id=customer_id).first()
    if not appointment:
        return jsonify({"error": "Appointment not found"}), 404

    try:
        db.session.delete(appointment)
        db.session.commit()
        return jsonify({"message": "Appointment deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

# Get customer reviews
@customer_bp.route("/customers/<int:customer_id>/reviews", methods=["GET"])
@jwt_required()
def get_customer_reviews(customer_id):
    current_user_id =int(get_jwt_identity())
    if current_user_id != customer_id:
        return jsonify({"error": "Unauthorized access"}), 403

    stylist_reviews = Review.query.filter_by(customer_id=customer_id).all()
    salon_reviews = SalonReview.query.filter_by(customer_id=customer_id).all()

    if not stylist_reviews and not salon_reviews:
        return jsonify({"message": "You haven't reviewed any stylists or salons yet."}), 200

    return jsonify({
        "stylist": [
            {
                "id": rev.id,
                "stylist": rev.stylist.name,
                "rating": rev.rating,
                "comment": rev.comment,
                "created_at": rev.created_at.isoformat()
            } for rev in stylist_reviews
        ],
        "salon": [
            {
                "id": rev.id,
                "salon": rev.salon.name,
                "rating": rev.rating,
                "comment": rev.comment,
                "created_at": rev.created_at.isoformat()
            } for rev in salon_reviews
        ]
    }), 200

@customer_bp.route("/customers/<int:customer_id>/appointments", methods=["POST"])
@jwt_required()
def create_appointment(customer_id):
    current_user_id = int(get_jwt_identity())
    if current_user_id != customer_id:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    
    # Extract separate date and time
    appointment_date_str = data.get("appointment_date")  # "YYYY-MM-DD"
    appointment_time_str = data.get("appointment_time")  # "HH:MM"
    stylist_id = data.get("stylist_id")
    service_id = data.get("service_id")

    if not all([stylist_id, service_id, appointment_date_str, appointment_time_str]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        # Parse date and time separately
        appointment_date = datetime.strptime(appointment_date_str, "%Y-%m-%d").date()
        appointment_time = datetime.strptime(appointment_time_str, "%H:%M").time()
        
        # Combine into datetime for the unique constraint check
        appointment_datetime = datetime.combine(appointment_date, appointment_time)
        
        # Check if appointment is in the future
        if appointment_datetime < datetime.utcnow():
            return jsonify({"error": "Appointment must be in the future"}), 400

        # Check for existing appointment at the same time
        existing = Appointment.query.filter_by(
            stylist_id=stylist_id,
            start_datetime=appointment_datetime
        ).first()
        
        if existing:
            return jsonify({"error": "Stylist already booked at this time"}), 400

        new_appointment = Appointment(
            customer_id=customer_id,
            stylist_id=stylist_id,
            service_id=service_id,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            start_datetime=appointment_datetime
        )
        
        db.session.add(new_appointment)
        db.session.commit()

        return jsonify(new_appointment.to_dict()), 201
        
    except ValueError as e:
        return jsonify({"error": f"Invalid date/time format: {str(e)}"}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to create appointment: {str(e)}"}), 500