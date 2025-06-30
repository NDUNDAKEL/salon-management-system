from flask import Blueprint, request, jsonify
from models import db, Salon, Stylist, Service, Review, SalonReview, Appointment, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_mail import Message
from datetime import datetime, timedelta
from app import mail


stylist_bp = Blueprint('stylist_bp', __name__)

# Helper function to check if user is admin
def is_admin():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    return user and user.is_admin

@stylist_bp.route('/stylists', methods=['POST'])
@jwt_required()
def create_stylist():
    if not is_admin():
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    salon_id = data.get('salon_id') or 1
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    specialization = data.get('specialization')
    bio = data.get('bio')
    service_ids = data.get('service_ids', [])
    username = data.get('username') or email.split('@')[0]
    password = data.get('password') or "123456"

    if not all([salon_id, name, email]):
        return jsonify({"error": "Salon ID, name, and email are required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already in use"}), 409

    salon = Salon.query.get(salon_id)
    if not salon:
        return jsonify({"error": "Salon not found"}), 404

    try:
        # Step 1: Create the user (don't commit yet)
        user = User(
            username=username,
            email=email,
            phone=phone,
            is_stylist=True,
            is_admin=False
        )
        user.set_password(password)
        db.session.add(user)
        db.session.flush()  # So we can get user.id

        # Step 2: Create the stylist
        new_stylist = Stylist(
            user_id=user.id,
            salon_id=salon_id,
            name=name,
            email=email,
            phone=phone,
            specialization=specialization,
            bio=bio
        )
        db.session.add(new_stylist)
        db.session.flush()  # Get stylist.id

        # Step 3: Link stylist ID to user
        user.stylist_id = new_stylist.id

        # Step 4: Attach services
        for service_id in service_ids:
            service = Service.query.get(service_id)
            if service and service.salon_id == int(salon_id):
                new_stylist.services.append(service)

        # Step 5: Commit all
        db.session.commit()

        # Step 6: Send welcome email
        try:
            msg = Message(
                subject="Your Stylist Account",
                recipients=[email],
                body=f"""Welcome {name}!

Your stylist account has been created.
Username: {username}
Temporary Password: {password}

Please change your password after first login."""
            )
            mail.send(msg)
        except Exception as e:
            app.logger.error(f"Failed to send email: {str(e)}")

        return jsonify({
            "message": "Stylist created successfully",
            "stylist": new_stylist.to_dict(include_services=True, include_user=True)
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# Get all stylists (Admin only)
@stylist_bp.route('/stylists', methods=['GET'])
@jwt_required()
def get_all_stylists():
    if not is_admin():
        return jsonify({"error": "Admin access required"}), 403

    try:
        stylists = Stylist.query.all()
        return jsonify([{
            "id": stylist.id,
            "name": stylist.name,
            "email": stylist.email if stylist.email else None,
            "phone": stylist.phone if stylist.phone else None,
            "specialization": stylist.specialization,
            "salon_id": stylist.salon_id,
            "salon_name": stylist.salon.name if stylist.salon else None,
            "profile_pic": stylist.profile_pic,
            "average_rating": stylist.average_rating(),
            "services": [{
                "id": service.id,
                "name": service.name
            } for service in stylist.services],
            "is_active": stylist.is_active,
            "created_at": stylist.created_at.isoformat() if stylist.created_at else None
        } for stylist in stylists]), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Get stylist by ID
@stylist_bp.route('/stylists/<int:stylist_id>', methods=['GET'])
def get_stylist(stylist_id):
    stylist = Stylist.query.get_or_404(stylist_id)
    return jsonify({
        "id": stylist.id,
        "name": stylist.name,
        "specialization": stylist.specialization,
        "bio": stylist.bio,
        "profile_pic": stylist.profile_pic,
        "salon_id": stylist.salon_id,
        "salon_name": stylist.salon.name if stylist.salon else None,
        "average_rating": stylist.average_rating(),
        "services": [{
            "id": service.id,
            "name": service.name,
            "price": service.price,
            "duration": service.duration
        } for service in stylist.services],
        "reviews": [{
            "id": review.id,
            "rating": review.rating,
            "comment": review.comment,
            "customer_name": review.customer.username,
            "created_at": review.created_at.isoformat()
        } for review in stylist.reviews if not review.is_hidden]
    }), 200

# Update stylist (Admin only)
@stylist_bp.route('/stylists/<int:stylist_id>', methods=['PUT'])
@jwt_required()
def update_stylist(stylist_id):
    if not is_admin():
        return jsonify({"error": "Admin access required"}), 403

    stylist = Stylist.query.get_or_404(stylist_id)
    data = request.get_json()  # ✅ This handles JSON input now

    stylist.name = data.get('name', stylist.name)
    stylist.email = data.get('email', stylist.email)
    stylist.phone = data.get('phone', stylist.phone)
    stylist.specialization = data.get('specialization', stylist.specialization)
    stylist.bio = data.get('bio', stylist.bio)

    salon_id = data.get('salon_id')
    if salon_id:
        salon = Salon.query.get(salon_id)
        if salon:
            stylist.salon_id = salon_id

    # Handle service IDs
    service_ids = data.get('service_ids', [])
    if isinstance(service_ids, list):
        stylist.services = []
        for service_id in service_ids:
            service = Service.query.get(service_id)
            if service and service.salon_id == stylist.salon_id:
                stylist.services.append(service)

    db.session.commit()

    return jsonify({"message": "Stylist updated successfully"}), 200


#get stylist appointments


@stylist_bp.route("/stylists/<int:stylist_id>/appointments", methods=["GET"])
@jwt_required()
def get_customer_appointments(stylist_id):
    
    appointments = Appointment.query.filter_by(stylist_id=stylist_id).all()

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

#mark cmpleteappointment
@stylist_bp.route("/stylists/appointments/<int:id>", methods=["PATCH"])
@jwt_required()
def update_appointments(id):
    appointment = Appointment.query.get_or_404(id)

    # Toggle logic: if completed, set to pending; else set to completed
    if appointment.status == "completed":
        appointment.status = "pending"
    else:
        appointment.status = "completed"

    db.session.commit()

    return jsonify({
        "message": "Appointment status toggled",
        "new_status": appointment.status
    }), 200

# Delete stylist (Admin only)
@stylist_bp.route('/stylists/<int:stylist_id>', methods=['DELETE'])
@jwt_required()
def delete_stylist(stylist_id):
    if not is_admin():
        return jsonify({"error": "Admin access required"}), 403

    stylist = Stylist.query.get_or_404(stylist_id)
    stylist_name = stylist.name
    salon_id = stylist.salon_id

    db.session.delete(stylist)
    db.session.commit()

    # Send email to admin
    try:
        msg = Message(
            subject="Stylist Deleted",
            recipients=["admin@example.com"],  # Replace with actual admin email
            body=f"""The following stylist has been deleted:

Name: {stylist_name}
Salon ID: {salon_id}

Best regards,
Salon System
"""
        )
        mail.send(msg)
    except Exception as e:
        print("Email send failed:", e)

    return jsonify({"message": "Stylist deleted successfully"}), 200

# Get stylist availability
@stylist_bp.route('/stylists/<int:stylist_id>/availability', methods=['GET'])
def get_stylist_availability(stylist_id):
    date = request.args.get('date')
    if not date:
        return jsonify({"error": "Date parameter is required"}), 400

    try:
        target_date = datetime.strptime(date, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    appointments = Appointment.query.filter(
        db.func.date(Appointment.appointment_date) == target_date,
        Appointment.stylist_id == stylist_id
    ).all()

    booked_slots = [app.appointment_date.time() for app in appointments]

    available_slots = []
    start_time = datetime.strptime("09:00", "%H:%M").time()
    end_time = datetime.strptime("18:00", "%H:%M").time()

    current_time = start_time
    while current_time <= end_time:
        if current_time not in booked_slots:
            available_slots.append(current_time.strftime("%H:%M"))
        current_time = (datetime.combine(datetime.min, current_time) + timedelta(minutes=30)).time()

    return jsonify({
        "stylist_id": stylist_id,
        "date": date,
        "available_slots": available_slots
    }), 200
