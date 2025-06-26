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

# Create a new stylist (Admin only)
@stylist_bp.route('/stylists', methods=['POST'])
@jwt_required()
def create_stylist():
    if not is_admin():
        return jsonify({"error": "Admin access required"}), 403

    data = request.get_json()
    salon_id = data.get('salon_id')
    name = data.get('name')
    specialization = data.get('specialization')
    bio = data.get('bio')
    service_ids = data.get('service_ids', [])
    
    if not all([salon_id, name]):
        return jsonify({"error": "Salon ID and name are required"}), 400

    salon = Salon.query.get(salon_id)
    if not salon:
        return jsonify({"error": "Salon not found"}), 404

    try:
        new_stylist = Stylist(
            salon_id=salon_id,
            name=name,
            specialization=specialization,
            bio=bio
        )

        for service_id in service_ids:
            service = Service.query.get(service_id)
            if service and service.salon_id == salon_id:
                new_stylist.services.append(service)

        db.session.add(new_stylist)
        db.session.commit()

        try:
            msg = Message(
                subject="New Stylist Created",
                recipients=["admin@example.com"],
                body=f"""New stylist added:
Name: {new_stylist.name}
Salon: {salon.name}"""
            )
            mail.send(msg)
        except Exception as e:
             return jsonify({"error": str(e)}), 500
        return jsonify({
            "message": "Stylist created successfully",
            "stylist": new_stylist.to_dict(include_services=True)
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
    data = request.form

    if 'name' in data:
        stylist.name = data['name']
    if 'specialization' in data:
        stylist.specialization = data['specialization']
    if 'bio' in data:
        stylist.bio = data['bio']
    if 'salon_id' in data:
        salon = Salon.query.get(data['salon_id'])
        if salon:
            stylist.salon_id = data['salon_id']

    if 'service_ids[]' in data:
        service_ids = request.form.getlist('service_ids[]')
        stylist.services = []
        for service_id in service_ids:
            service = Service.query.get(service_id)
            if service and service.salon_id == stylist.salon_id:
                stylist.services.append(service)

    db.session.commit()

    return jsonify({
        "message": "Stylist updated successfully",
        "stylist": {
            "id": stylist.id,
            "name": stylist.name,
            "services": [s.id for s in stylist.services]
        }
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
