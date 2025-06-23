from flask import Blueprint, request, jsonify
from models import db, Salon, Stylist, Service, Review, SalonReview, Appointment, User

from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

salon_bp = Blueprint('salon', __name__)

# Salon endpoints
@salon_bp.route('/salons', methods=['GET'])
def get_salons():
    salons = Salon.query.all()
    return jsonify([{
        'id': salon.id,
        'name': salon.name,
        'location': salon.location,
        'contact': salon.contact,
        'description': salon.description
    } for salon in salons]), 200

@salon_bp.route('/salons/<int:salon_id>', methods=['GET'])
def get_salon(salon_id):
    salon = Salon.query.get_or_404(salon_id)
    return jsonify({
        'id': salon.id,
        'name': salon.name,
        'location': salon.location,
        'contact': salon.contact,
        'description': salon.description,
        'services': [{
            'id': service.id,
            'name': service.name,
            'description': service.description,
            'duration': service.duration,
            'price': service.price
        } for service in salon.services],
        'stylists': [{
            'id': stylist.id,
            'name': stylist.name,
            'specialization': stylist.specialization
        } for stylist in salon.stylists]
    }), 200

# Stylist endpoints
@salon_bp.route('/stylists', methods=['GET'])
def get_stylists():
    stylists = Stylist.query.all()
    return jsonify([{
        'id': stylist.id,
        'name': stylist.name,
        'specialization': stylist.specialization,
        'salon_id': stylist.salon_id,
        'average_rating': stylist.average_rating()
    } for stylist in stylists]), 200

@salon_bp.route('/stylists/<int:stylist_id>', methods=['GET'])
def get_stylist(stylist_id):
    stylist = Stylist.query.get_or_404(stylist_id)
    return jsonify({
        'id': stylist.id,
        'name': stylist.name,
        'specialization': stylist.specialization,
        'bio': stylist.bio,
        'salon_id': stylist.salon_id,
        'services': [{
            'id': service.id,
            'name': service.name
        } for service in stylist.services],
        'average_rating': stylist.average_rating(),
        'reviews': [{
            'id': review.id,
            'rating': review.rating,
            'comment': review.comment,
            'customer_name': review.customer.username,
            'created_at': review.created_at
        } for review in stylist.reviews if not review.is_hidden]
    }), 200

# Service endpoints
@salon_bp.route('/services', methods=['GET'])
def get_services():
    services = Service.query.all()
    return jsonify([{
        'id': service.id,
        'name': service.name,
        'description': service.description,
        'duration': service.duration,
        'price': service.price,
        'salon_id': service.salon_id
    } for service in services]), 200

# Appointment endpoints
@salon_bp.route('/appointments', methods=['POST'])
@jwt_required()
def create_appointment():
    data = request.get_json()
    customer_id = get_jwt_identity()
    stylist_id = data.get('stylist_id')
    service_id = data.get('service_id')
    appointment_date = data.get('appointment_date')

    if not all([stylist_id, service_id, appointment_date]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        appointment_date = datetime.fromisoformat(appointment_date)
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    stylist = Stylist.query.get(stylist_id)
    service = Service.query.get(service_id)

    if not stylist or not service:
        return jsonify({"error": "Stylist or service not found"}), 404

    if service not in stylist.services:
        return jsonify({"error": "This stylist doesn't offer the selected service"}), 400

    conflicting = Appointment.query.filter_by(
        stylist_id=stylist_id,
        appointment_date=appointment_date
    ).first()
    if conflicting:
        return jsonify({"error": "Stylist is not available at this time"}), 400

    new_appointment = Appointment(
        customer_id=customer_id,
        stylist_id=stylist_id,
        service_id=service_id,
        appointment_date=appointment_date,
        status='pending'
    )

    db.session.add(new_appointment)
    db.session.commit()

    return jsonify({
        "message": "Appointment created successfully",
        "appointment": {
            "id": new_appointment.id,
            "customer_id": new_appointment.customer_id,
            "stylist_id": new_appointment.stylist_id,
            "service_id": new_appointment.service_id,
            "appointment_date": new_appointment.appointment_date.isoformat(),
            "status": new_appointment.status
        }
    }), 201

@salon_bp.route('/appointments', methods=['GET'])
@jwt_required()
def get_user_appointments():
    user_id = get_jwt_identity()
    appointments = Appointment.query.filter_by(customer_id=user_id).all()

    return jsonify([{
        "id": appointment.id,
        "stylist_name": appointment.stylist.name,
        "service_name": appointment.service.name,
        "appointment_date": appointment.appointment_date.isoformat(),
        "status": appointment.status
    } for appointment in appointments]), 200

# Review endpoints
@salon_bp.route('/reviews/stylist', methods=['POST'])
@jwt_required()
def create_stylist_review():
    data = request.get_json()
    customer_id = get_jwt_identity()
    stylist_id = data.get('stylist_id')
    rating = data.get('rating')
    comment = data.get('comment', '')

    if not all([stylist_id, rating]):
        return jsonify({"error": "Missing required fields"}), 400

    if not (1 <= int(rating) <= 5):
        return jsonify({"error": "Rating must be between 1 and 5"}), 400

    appointment = Appointment.query.filter_by(
        customer_id=customer_id,
        stylist_id=stylist_id,
        status='completed'
    ).first()

    if not appointment:
        return jsonify({"error": "You can only review stylists you've had completed appointments with"}), 400

    existing_review = Review.query.filter_by(
        customer_id=customer_id,
        stylist_id=stylist_id
    ).first()

    if existing_review:
        return jsonify({"error": "You've already reviewed this stylist"}), 400

    new_review = Review(
        customer_id=customer_id,
        stylist_id=stylist_id,
        rating=rating,
        comment=comment
    )

    db.session.add(new_review)
    db.session.commit()

    return jsonify({
        "message": "Review submitted successfully",
        "review": {
            "id": new_review.id,
            "stylist_id": new_review.stylist_id,
            "rating": new_review.rating,
            "comment": new_review.comment
        }
    }), 201

@salon_bp.route('/reviews/salon', methods=['POST'])
@jwt_required()
def create_salon_review():
    data = request.get_json()
    customer_id = get_jwt_identity()
    salon_id = data.get('salon_id')
    rating = data.get('rating')
    comment = data.get('comment', '')

    if not all([salon_id, rating]):
        return jsonify({"error": "Missing required fields"}), 400

    if not (1 <= int(rating) <= 5):
        return jsonify({"error": "Rating must be between 1 and 5"}), 400

    appointment = Appointment.query.join(Stylist).filter(
        Appointment.customer_id == customer_id,
        Stylist.salon_id == salon_id,
        Appointment.status == 'completed'
    ).first()

    if not appointment:
        return jsonify({"error": "You can only review salons you've had completed appointments with"}), 400

    existing_review = SalonReview.query.filter_by(
        customer_id=customer_id,
        salon_id=salon_id
    ).first()

    if existing_review:
        return jsonify({"error": "You've already reviewed this salon"}), 400

    new_review = SalonReview(
        customer_id=customer_id,
        salon_id=salon_id,
        rating=rating,
        comment=comment
    )

    db.session.add(new_review)
    db.session.commit()

    return jsonify({
        "message": "Review submitted successfully",
        "review": {
            "id": new_review.id,
            "salon_id": new_review.salon_id,
            "rating": new_review.rating,
            "comment": new_review.comment
        }
    }), 201

# Average rating methods
def average_rating(self):
    reviews = [review.rating for review in self.reviews if not review.is_hidden]
    return sum(reviews) / len(reviews) if reviews else 0

Stylist.average_rating = average_rating
Salon.average_rating = average_rating
