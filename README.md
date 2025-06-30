
## youtube video link -
Video is uploading, remaining approximatedly 10 mins

# Salon System

A modern, full-stack salon management system that enables customers to book appointments, view available services and stylists, and allows admins to manage customers, appointments, and services efficiently.

---

## Features

### For Customers:
- Sign up and log in securely
- View list of stylists and their specializations
- Book appointments with available time slots
- View appointment history
- Secure JWT authentication

### For Admin:
- Manage customer accounts
- Add/edit/delete stylists and services
- View, edit, or delete appointments
- Block or unblock customers

---

## Tech Stack

### Backend:
- Flask (Python)
- SQLAlchemy (ORM)
- JWT Authentication
- RESTful API

### Frontend:
- (Optional) React, Vite, Tailwind CSS

### Database:
- PostgreSQL / MySQL / SQLite (Choose one)

---

## Installation

### Backend

```bash
# Clone the repository
git clone https://github.com/NDUNDAKEL/salon-management-system.git
cd salon-system/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export FLASK_APP=app.py
export FLASK_ENV=development
export SECRET_KEY=your_secret_key

# Run the app
flask run
Frontend (if available)
bash
Copy
Edit
cd ../frontend
npm install
npm run dev
Project Structure
cpp
Copy
Edit
salon-system/
│
├── backend/
│   ├── app.py
│   ├── models/
│   ├── routes/
│   ├── static/
│   └── templates/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── ...
│
└── README.md
API Endpoints (Example)
Method	Endpoint	Description
GET	/api/customers	Get all customers
POST	/api/login	Login with email and password
POST	/api/appointments	Book a new appointment
DELETE	/api/admin/stylists/<id>	Delete a stylist (admin only)
PUT	/api/admin/services/<id>	Edit a service (admin only)

Testing
You can test the API using Postman or cURL:

bash
Copy
Edit
curl -X GET https://salon-management-system-2.onrender.com/api/customers
Screenshots
(Optional: Add screenshots or GIFs of the app's UI)

Contributing
Contributions are welcome. Please fork the repo and submit a pull request.

 License
This project is licensed under the MIT License.

Contact
Kelvin Ndunda – [kelvinndunda9@gmail.com]
Project Link:https://github.com/NDUNDAKEL/salon-management-system.git

yaml
Copy
Edit

---













Tools


