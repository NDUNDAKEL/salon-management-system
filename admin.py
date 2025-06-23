from flask import Blueprint, request, jsonify
from models import db, User, Salon, Stylist, Service, Review, SalonReview
from flask_jwt_extended import jwt_required, get_jwt_identity

admin_bp = Blueprint('admin', __name__)

@admin_bp.before_request
@jwt_required()
def check_admin():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user or not user.is_admin:
        return jsonify({"error": "Admin access required"}), 403

# User management
@admin_bp.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([{
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_admin': user.is_admin,
        'is_blocked': user.is_blocked,
        'created_at': user.created_at
    } for user in users]), 200

@admin_bp.route('/users/<int:user_id>/block', methods=['PUT'])
def block_user(user_id):
    user = User.query.get_or_404(user_id)
    user.is_blocked = True
    db.session.commit()
    return jsonify({"message": "User blocked successfully"}), 200

@admin_bp.route('/users/<int:user_id>/unblock', methods=['PUT'])
def unblock_user(user_id):
    user = User.query.get_or_404(user_id)
    user.is_blocked = False
    db.session.commit()
    return jsonify({"message": "User unblocked successfully"}), 200

# Salon management
@admin_bp.route('/salons', methods=['POST'])
def create_salon():
    data = request.get_json()
    required_fields = ['name', 'location', 'contact']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
    
    new_salon = Salon(
        name=data['name'],
        location=data['location'],
        contact=data['contact'],
        description=data.get('description', '')
    )
    
    db.session.add(new_salon)
    db.session.commit()
    
    return jsonify({
        "message": "Salon created successfully",
        "salon": {
            "id": new_salon.id,
            "name": new_salon.name,
            "location": new_salon.location
        }
    }), 201

# Stylist management
@admin_bp.route('/stylists', methods=['POST'])
def create_stylist():
    data = request.get_json()
    required_fields = ['name', 'salon_id']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
    
    new_stylist = Stylist(
        name=data['name'],
        salon_id=data['salon_id'],
        specialization=data.get('specialization', ''),
        bio=data.get('bio', '')
    )
    
    db.session.add(new_stylist)
    db.session.commit()
    
    return jsonify({
        "message": "Stylist created successfully",
        "stylist": {
            "id": new_stylist.id,
            "name": new_stylist.name,
            "salon_id": new_stylist.salon_id
        }
    }), 201

# Service management
@admin_bp.route('/services', methods=['POST'])
def create_service():
    data = request.get_json()
    required_fields = ['name', 'salon_id']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
    
    new_service = Service(
        name=data['name'],
        salon_id=data['salon_id'],
        description=data.get('description', ''),
        duration=data.get('duration', 30),
        price=data.get('price', 0)
    )
    
    db.session.add(new_service)
    db.session.commit()
    
    return jsonify({
        "message": "Service created successfully",
        "service": {
            "id": new_service.id,
            "name": new_service.name,
            "salon_id": new_service.salon_id
        }
    }), 201

# Review management
@admin_bp.route('/reviews/stylist/<int:review_id>/hide', methods=['PUT'])
def hide_stylist_review(review_id):
    review = Review.query.get_or_404(review_id)
    review.is_hidden = True
    db.session.commit()
    return jsonify({"message": "Review hidden successfully"}), 200

@admin_bp.route('/reviews/stylist/<int:review_id>/show', methods=['PUT'])
def show_stylist_review(review_id):
    review = Review.query.get_or_404(review_id)
    review.is_hidden = False
    db.session.commit()
    return jsonify({"message": "Review made visible successfully"}), 200

@admin_bp.route('/reviews/salon/<int:review_id>/hide', methods=['PUT'])
def hide_salon_review(review_id):
    review = SalonReview.query.get_or_404(review_id)
    review.is_hidden = True
    db.session.commit()
    return jsonify({"message": "Review hidden successfully"}), 200

@admin_bp.route('/reviews/salon/<int:review_id>/show', methods=['PUT'])
def show_salon_review(review_id):
    review = SalonReview.query.get_or_404(review_id)
    review.is_hidden = False
    db.session.commit()
    return jsonify({"message": "Review made visible successfully"}), 200