from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone
from flask_jwt_extended import create_access_token
from sqlalchemy import func
from datetime import time


import time 
from datetime import datetime, timezone, timedelta

import os
from werkzeug.utils import secure_filename

db = SQLAlchemy()

# Helper function for file uploads
def save_file(file, folder):
    if file and file.filename:
        filename = secure_filename(f"{datetime.now().timestamp()}_{file.filename}")
        filepath = os.path.join('static', 'uploads', folder, filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        file.save(filepath)
        return f"uploads/{folder}/{filename}"
    return None

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    phone = db.Column(db.String(20))
    profile_pic = db.Column(db.String(255))
    is_admin = db.Column(db.Boolean, default=False)
    is_blocked = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    appointments = db.relationship('Appointment', backref='customer', lazy=True, cascade="all, delete-orphan")
    reviews = db.relationship('Review', backref='customer', lazy=True, cascade="all, delete-orphan")
    salon_reviews = db.relationship('SalonReview', backref='customer', lazy=True, cascade="all, delete-orphan")
    
    def set_password(self, password):
        self.password = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password, password)
    
    def generate_token(self):
        self.last_login = datetime.utcnow()
        db.session.commit()
        return create_access_token(identity=self.id)
    
    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "phone": self.phone,
            "profile_pic": self.profile_pic,
            "is_admin": self.is_admin,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None
        }

class TokenBlocklist(db.Model):
    __tablename__ = 'token_blocklist'
    
    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Salon(db.Model):
    __tablename__ = 'salons'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    location = db.Column(db.String(200), nullable=False)
    contact = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    cover_image = db.Column(db.String(255))
    opening_hours = db.Column(db.JSON)  # Stores opening hours as JSON
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    services = db.relationship('Service', backref='salon', lazy=True, cascade="all, delete-orphan")
    stylists = db.relationship('Stylist', backref='salon', lazy=True, cascade="all, delete-orphan")
    reviews = db.relationship('SalonReview', backref='salon', lazy=True, cascade="all, delete-orphan")
    
    def average_rating(self):
        avg = db.session.query(func.avg(SalonReview.rating)).filter(
            SalonReview.salon_id == self.id,
            SalonReview.is_hidden == False
        ).scalar()
        return round(avg, 2) if avg else 0.0
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "location": self.location,
            "contact": self.contact,
            "description": self.description,
            "cover_image": self.cover_image,
            "opening_hours": self.opening_hours,
            "average_rating": self.average_rating(),
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
class Stylist(db.Model):
    __tablename__ = 'stylists'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    specialization = db.Column(db.String(100))
    bio = db.Column(db.Text)
    phone = db.Column(db.String(20))  # New
    email = db.Column(db.String(120))  # New
    profile_pic = db.Column(db.String(255))
    salon_id = db.Column(db.Integer, db.ForeignKey('salons.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    years_experience = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    appointments = db.relationship('Appointment', backref='stylist', lazy='dynamic', cascade="all, delete-orphan")
    reviews = db.relationship('Review', backref='stylist', lazy='dynamic', cascade="all, delete-orphan")
    services = db.relationship('Service', secondary='stylist_services', back_populates='stylists', lazy='dynamic')
    
    def __init__(self, **kwargs):
        super(Stylist, self).__init__(**kwargs)
        if not self.slug and self.name:
            self.slug = self._generate_slug()
    
    def _generate_slug(self):
        return self.name.lower().replace(' ', '-') + '-' + str(int(time.time()))
    
    def average_rating(self):
        avg = db.session.query(func.avg(Review.rating)).filter(
            Review.stylist_id == self.id,
            Review.is_hidden == False
        ).scalar()
        return round(avg, 2) if avg else 0.0
    
    def to_dict(self, include_services=False):
        data = {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "specialization": self.specialization,
            "bio": self.bio,
            "phone": self.phone,  # New
            "email": self.email,  # New
            "profile_pic": self.profile_pic,
            "salon_id": self.salon_id,
            "salon_name": self.salon.name if self.salon else None,
            "is_active": self.is_active,
            "years_experience": self.years_experience,
            "average_rating": self.average_rating(),
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
        if include_services:
            data['services'] = [s.to_dict() for s in self.services.all()]
        return data

class Service(db.Model):
    __tablename__ = 'services'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    slug = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    duration = db.Column(db.Integer)  # in minutes
    price = db.Column(db.Float)
    category = db.Column(db.String(50))
    salon_id = db.Column(db.Integer, db.ForeignKey('salons.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    stylists = db.relationship('Stylist', secondary='stylist_services', back_populates='services')
    appointments = db.relationship('Appointment', backref='service', lazy=True)
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "description": self.description,
            "duration": self.duration,
            "price": self.price,
            "category": self.category,
            "salon_id": self.salon_id,
            "is_active": self.is_active
        }

# Many-to-Many relationship between Stylist and Service
stylist_services = db.Table('stylist_services',
    db.Column('stylist_id', db.Integer, db.ForeignKey('stylists.id'), primary_key=True),
    db.Column('service_id', db.Integer, db.ForeignKey('services.id'), primary_key=True)
)

class Appointment(db.Model):
    __tablename__ = 'appointments'
    
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    stylist_id = db.Column(db.Integer, db.ForeignKey('stylists.id'), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False)
    appointment_date = db.Column(db.Date, nullable=True)  # Date only
    appointment_time = db.Column(db.Time, nullable=True)  # Time only
    start_datetime = db.Column(db.DateTime, nullable=True)  # Combined datetime
    end_datetime = db.Column(db.DateTime)  # Calculated end time
    status = db.Column(db.String(20), default='pending')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        db.Index('idx_appointment_datetime', 'stylist_id', 'start_datetime', unique=True),
    )
    
    def __init__(self, **kwargs):
        super(Appointment, self).__init__(**kwargs)
        # Combine date and time into start_datetime
        if self.appointment_date and self.appointment_time:
            self.start_datetime = datetime.combine(self.appointment_date, self.appointment_time)
        # Calculate end time if service duration is available
        if hasattr(self, 'service') and self.service and self.start_datetime:
            self.end_datetime = self.start_datetime + timedelta(minutes=self.service.duration)
    
    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "stylist_id": self.stylist_id,
            "service_id": self.service_id,
            "appointment_date": self.appointment_date.isoformat(),
            "appointment_time": self.appointment_time.isoformat(timespec='minutes'),
            "start_datetime": self.start_datetime.isoformat(),
            "end_datetime": self.end_datetime.isoformat() if self.end_datetime else None,
            "status": self.status,
            "notes": self.notes,
            "created_at": self.created_at.isoformat()
        }

class Review(db.Model):
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    stylist_id = db.Column(db.Integer, db.ForeignKey('stylists.id'), nullable=False)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'))
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_hidden = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "customer_name": self.customer.username if self.customer else None,
            "stylist_id": self.stylist_id,
            "stylist_name": self.stylist.name if self.stylist else None,
            "appointment_id": self.appointment_id,
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class SalonReview(db.Model):
    __tablename__ = 'salon_reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    salon_id = db.Column(db.Integer, db.ForeignKey('salons.id'), nullable=False)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'))
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_hidden = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        return {
            "id": self.id,
            "customer_id": self.customer_id,
            "customer_name": self.customer.username if self.customer else None,
            "salon_id": self.salon_id,
            "salon_name": self.salon.name if self.salon else None,
            "appointment_id": self.appointment_id,
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }