# 🍱 FoodBridge – Food Donation and Redistribution Platform

FoodBridge is a web-based food donation and redistribution platform that connects food donors with NGOs. It helps reduce food waste by making surplus food available to organizations that can distribute it to people in need.

The platform provides separate dashboards for donors, NGOs, and administrators, making food donation and request management easier and more organized.

## ✨ Features

### 👤 User Authentication
- Donor and NGO registration and login.
- JWT-based authentication.
- Role-based access control.
- Separate dashboards based on user roles.

### 🍲 Donor Features
- Add food donations with quantity, servings, and expiry details.
- View and manage personal donations.
- Update or cancel available donations.
- View requests received from NGOs.
- Accept, reject, or complete donation requests.

### 🏢 NGO Features
- Register an NGO and upload its registration certificate.
- Browse available food donations.
- Search donations by food name.
- Filter donations expiring within 24 hours.
- Sort donations by newest or earliest expiry.
- Send food requests to donors.
- Track the status of submitted requests.

### 🛡️ Admin Features
- Admin dashboard with platform statistics.
- View registered users and NGOs.
- Review NGO registration details.
- Approve or reject NGO verification requests.

## 🛠️ Technology Stack

| Area | Technologies |
|---|---|
| Frontend | React.js, Vite, CSS |
| Backend | Python, Django, Django REST Framework |
| Authentication | JWT |
| API Communication | Axios |
| Testing | Playwright |
| Version Control | Git and GitHub |

## 📁 Project Structure

```text
FoodBridge/
│
├── backend/
│   ├── accounts/
│   ├── donors/
│   ├── ngos/
│   ├── config/
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── index.html
│
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd FoodBridge
```

### 2. Backend Setup

Open a terminal:

```bash
cd backend
python -m venv venv
source venv/bin/activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Apply database migrations:

```bash
python manage.py migrate
```

Create an administrator account:

```bash
python manage.py createsuperuser
```

Start the Django development server:

```bash
python manage.py runserver 8001
```

Backend API:

```text
http://127.0.0.1:8001/api/
```

Django Admin:

```text
http://127.0.0.1:8001/admin/
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the frontend URL displayed by Vite in your browser.

## 🔐 User Roles

| Role | Permissions |
|---|---|
| Donor | Add food donations and manage NGO requests |
| NGO | Browse available food and request donations |
| Admin | Manage users and verify NGOs |

## 🧪 Testing

Run the donor registration test using Playwright:

```bash
cd frontend
npx playwright test tests/register.spec.js
```

## 🎯 Project Objective

The main objective of FoodBridge is to reduce food wastage and improve food accessibility by connecting food donors with NGOs through a centralized digital platform.

## 🚀 Future Enhancements

- Real-time notifications for donation requests.
- Food pickup and delivery tracking.
- Location-based donation discovery.
- Food expiry alerts.
- Impact analytics showing food saved and people supported.

## 👩‍💻 Developed With

Built as a full-stack web development project using React and Django, with a focus on food redistribution, waste reduction, and social impact.
