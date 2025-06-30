from app import create_app, db
from models import User, Stylist, Salon, Service, Appointment, Review, SalonReview
from datetime import date, time

app = create_app()

with app.app_context():
    db.drop_all()
    db.create_all()

    # Create salon
    salon = Salon(
        name="Glamour Salon",
        slug="glamour-salon",
        location="Downtown Nairobi",
        contact="0712345678",
        description="Modern salon with amazing stylists.",
        opening_hours={
            "Mon-Fri": "9am - 6pm",
            "Sat": "9am - 4pm",
            "Sun": "Closed"
        }
    )
    db.session.add(salon)
    db.session.commit()

    # Create admin user
    admin = User(
        username="admin",
        email="admin@example.com",
        phone="0700000000",
        is_admin=True
    )
    admin.set_password("admin123")
    db.session.add(admin)

    # Create stylist user
    stylist_user = User(
        username="stylist1",
        email="stylist@example.com",
        phone="0711000000",
        is_stylist=True
    )
    stylist_user.set_password("stylist123")
    db.session.add(stylist_user)

    # Create regular customer
    customer = User(
        username="johndoe",
        email="john@example.com",
        phone="0722000000"
    )
    customer.set_password("password123")
    db.session.add(customer)
    db.session.commit()

    # Create stylist profile
    stylist = Stylist(
        user_id=stylist_user.id,
        salon_id=salon.id,
        name="Mary Hair Expert",
        specialization="Braiding",
        slug="mary-hair-expert",
        bio="Over 5 years of professional braiding.",
        phone=stylist_user.phone,
        email=stylist_user.email
    )
    db.session.add(stylist)
    db.session.commit()

    # Create service
    service = Service(
        name="Box Braids",
        slug="box-braids",
        description="Stylish box braids for any occasion.",
        duration=90,
        price=2000,
        category="Hair",
        salon_id=salon.id
    )
    db.session.add(service)
    db.session.commit()

    # Link stylist to service
    stylist.services.append(service)
    db.session.commit()

    # Create appointment
    appointment = Appointment(
        customer_id=customer.id,
        stylist_id=stylist.id,
        service_id=service.id,
        appointment_date=date.today(),
        appointment_time=time(10, 30),
        status="completed",
        notes="Customer prefers mid-back length"
    )
    db.session.add(appointment)
    db.session.commit()

    # Add stylist review
    review = Review(
        customer_id=customer.id,
        stylist_id=stylist.id,
        appointment_id=appointment.id,
        rating=5,
        comment="Awesome experience!"
    )
    db.session.add(review)

    # Add salon review
    salon_review = SalonReview(
        customer_id=customer.id,
        salon_id=salon.id,
        appointment_id=appointment.id,
        rating=4,
        comment="Great ambiance, clean environment."
    )
    db.session.add(salon_review)

    db.session.commit()
    print("✅ Seed data created.")
