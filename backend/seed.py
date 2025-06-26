from app import app, db
from models import User, Salon, Stylist, Service  # adjust this if your models are in a separate folder
from werkzeug.security import generate_password_hash
from datetime import datetime

with app.app_context():
    # Clear existing data (optional)
    db.drop_all()
    db.create_all()

    # Create a sample user
    user = User(
        username='testuser',
        email='test@example.com',
        phone='0712345678',
        password=generate_password_hash('password123')
    )

    # Create a sample salon
    salon = Salon(
        name='Bliss Salon',
        slug='bliss-salon',
        location='Nairobi CBD',
        contact='0712345678',
        description='A great place to get pampered.',
        cover_image='uploads/salon/sample.jpg',
        opening_hours={
            "mon": "9:00-18:00",
            "tue": "9:00-18:00",
            "wed": "9:00-18:00",
            "thu": "9:00-18:00",
            "fri": "9:00-18:00",
            "sat": "10:00-17:00",
            "sun": "closed"
        }
    )

    # Create a sample stylist
    stylist = Stylist(
        name='Jane Mwende',
        slug='jane-mwende',
        specialization='Braiding',
        bio='Expert in trendy braids and natural hair.',
        profile_pic='uploads/stylist/jane.jpg',
        salon=salon,
        years_experience=5
    )

    # Create a sample service
    service = Service(
        name='Basic Haircut',
        slug='basic-haircut',
        description='Simple haircut for men or women.',
        duration=30,
        price=500,
        category='Hair',
        salon=salon,
        is_active=True
    )

    stylist.services.append(service)

    # Add all to session and commit
    db.session.add_all([user, salon, stylist, service])
    db.session.commit()

    print("✅ Database seeded successfully!")
