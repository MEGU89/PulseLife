# 🩸 Pulse Bank - Smart Blood Donation Management System

A comprehensive full-stack blood donation management platform connecting donors, hospitals, and recipients in real-time.

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Express.js](https://img.shields.io/badge/Express.js-5.x-green?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?logo=mongodb)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-black?logo=socket.io)
![TypeScript](https://img.shields.io/badge/TypeScript-Supported-blue?logo=typescript)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Workflow](#workflow)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Deployment](#deployment)

---

## 🎯 Overview

Pulse Bank is a modern blood donation platform that facilitates:
- **Donors** to register, schedule donations, and earn rewards
- **Hospitals** to create blood requests and manage donation schedules
- **Recipients** to request blood and track request status
- **Real-time notifications** for urgent blood requests
- **AI-powered chatbot** for assistance

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Landing    │  │    Auth      │  │   Role Dashboards    │   │
│  │    Page      │  │    Page      │  │ (Donor/Hospital/     │   │
│  │              │  │              │  │  Recipient)          │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                              │                                  │
│                    ┌─────────▼─────────┐                        │
│                    │   Supabase Auth   │                        │
│                    └───────────────────┘                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   REST API / WS   │
                    └───────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                       BACKEND (Express.js)                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐  │
│  │   Auth     │  │   Donor    │  │  Hospital  │  │  Request  │  │
│  │  Routes    │  │   Routes   │  │   Routes   │  │   Routes  │  │
│  └────────────┘  └────────────┘  └────────────┘  └───────────┘  │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐  │
│  │  Schedule  │  │    AI      │  │   Email    │  │ Socket.io │  │
│  │   Routes   │  │   Routes   │  │   Routes   │  │  (Realtime)│ │
│  └────────────┘  └────────────┘  └────────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │     MongoDB       │
                    │   (Database)      │
                    └───────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 15 | React framework with App Router |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Radix UI | Accessible UI components |
| Supabase | Authentication |
| Socket.io Client | Real-time updates |
| Leaflet | Map integration |

### Backend
| Technology | Purpose |
|------------|---------|
| Express.js 5 | REST API server |
| MongoDB + Mongoose | Database & ODM |
| Socket.io | Real-time WebSocket communication |
| JWT | Token-based authentication |
| Nodemailer | Email notifications |
| Node-cron | Scheduled tasks |
| Twilio | SMS notifications (optional) |

---

## 📁 Project Structure

```
PulseBank/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout
│   ├── auth/                     # Authentication pages
│   ├── donor/                    # Donor dashboard & features
│   │   ├── dashboard/            # Donor main dashboard
│   │   ├── schedule-donation/    # Schedule a donation
│   │   ├── history/              # Donation history
│   │   ├── perks/                # Rewards & perks
│   │   ├── requests/             # View blood requests
│   │   ├── stats/                # Donation statistics
│   │   └── profile/              # Donor profile
│   ├── hospital/                 # Hospital dashboard & features
│   │   ├── dashboard/            # Hospital main dashboard
│   │   ├── add-request/          # Create blood request
│   │   ├── new-request/          # New request form
│   │   ├── schedules/            # Manage donation schedules
│   │   ├── history/              # Request history
│   │   └── profile/              # Hospital profile
│   ├── recipient/                # Recipient dashboard & features
│   │   ├── dashboard/            # Recipient main dashboard
│   │   ├── create-request/       # Create blood request
│   │   ├── request-status/       # Track request status
│   │   ├── history/              # Request history
│   │   ├── settings/             # Account settings
│   │   └── profile/              # Recipient profile
│   ├── about/                    # About page
│   ├── profile/                  # User profile
│   └── api/                      # API routes (Next.js)
│       └── chat/                 # AI chat endpoint
│
├── Backend/                      # Express.js Backend
│   ├── server.js                 # Main server entry point
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/              # Business logic
│   │   ├── authController.js     # Authentication logic
│   │   ├── donorController.js    # Donor operations
│   │   ├── requestController.js  # Blood request operations
│   │   └── scheduleController.js # Schedule management
│   ├── models/                   # Mongoose schemas
│   │   ├── User.js               # User model
│   │   ├── Request.js            # Blood request model
│   │   ├── Donation.js           # Donation record model
│   │   └── DonationSchedule.js   # Schedule model
│   ├── routes/                   # API route definitions
│   │   ├── auth.js               # /auth endpoints
│   │   ├── donor.js              # /donor endpoints
│   │   ├── hospital.js           # /hospital endpoints
│   │   ├── request.js            # /request endpoints
│   │   ├── schedule.js           # /schedule endpoints
│   │   ├── email.js              # /email endpoints
│   │   ├── hospitalStats.js      # Hospital statistics
│   │   └── chat.js               # Chat endpoints
│   └── utils/
│       ├── email.js              # Email utility functions
│       └── scheduler.js          # Cron job scheduler
│
├── components/                   # React components
│   ├── ui/                       # Reusable UI components
│   ├── ai-chatbot.tsx            # AI chatbot component
│   ├── HospitalMap.tsx           # Hospital map view
│   ├── LeafletMap.tsx            # Map component
│   ├── location-detector.tsx     # Geolocation component
│   ├── profile-menu.tsx          # User profile menu
│   └── user-guard.tsx            # Route protection
│
├── hooks/                        # Custom React hooks
│   ├── use-mobile.ts             # Mobile detection
│   ├── use-toast.ts              # Toast notifications
│   ├── useLocationDetection.ts   # Location detection
│   └── useSocket.ts              # Socket.io hook
│
├── lib/                          # Utility libraries
│   ├── api-endpoints.ts          # API endpoint constants
│   ├── geolocation-service.ts    # Geolocation utilities
│   └── utils.ts                  # General utilities
│
├── styles/
│   └── globals.css               # Global styles
│
└── public/                       # Static assets
```

---

## 🔄 Workflow

### 1. User Registration & Authentication Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Landing   │───▶│    Auth     │───▶│   Select    │───▶│  Dashboard  │
│    Page     │    │   (Login/   │    │    Role     │    │  (Based on  │
│             │    │  Register)  │    │(Donor/Hosp/ │    │    Role)    │
│             │    │             │    │ Recipient)  │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 2. Blood Donation Workflow

```
                    ┌───────────────────────────────────────────────────┐
                    │                   HOSPITAL                         │
                    │  1. Creates blood request with:                   │
                    │     - Blood type needed                           │
                    │     - Units required                              │
                    │     - Urgency level (HIGH/MODERATE/LOW)           │
                    │     - Location radius (km)                        │
                    └───────────────────────────────────────────────────┘
                                          │
                                          ▼
                    ┌───────────────────────────────────────────────────┐
                    │               REAL-TIME NOTIFICATION              │
                    │  Socket.io broadcasts to all connected donors     │
                    └───────────────────────────────────────────────────┘
                                          │
                                          ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                                 DONOR                                      │
│  2. Views request on dashboard or receives notification                   │
│  3. Schedules donation with:                                              │
│     - Preferred date and time                                             │
│     - Contact information                                                 │
│     - Current location                                                    │
│     - Additional notes                                                    │
└───────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
                    ┌───────────────────────────────────────────────────┐
                    │               HOSPITAL REVIEW                      │
                    │  4. Hospital receives schedule notification       │
                    │  5. Reviews and accepts/rejects donation          │
                    └───────────────────────────────────────────────────┘
                                          │
                              ┌───────────┴───────────┐
                              ▼                       ▼
                    ┌─────────────────┐     ┌─────────────────┐
                    │    ACCEPTED     │     │    REJECTED     │
                    │  Donor notified │     │  Donor notified │
                    │  Donation date  │     │  Can reschedule │
                    │  confirmed      │     │                 │
                    └─────────────────┘     └─────────────────┘
                              │
                              ▼
                    ┌───────────────────────────────────────────────────┐
                    │               DONATION COMPLETED                   │
                    │  6. Hospital marks donation as complete           │
                    │  7. Donor receives rewards/perks                  │
                    │  8. Blood request status updated                  │
                    └───────────────────────────────────────────────────┘
```

### 3. Recipient Blood Request Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Recipient     │───▶│  Select nearby  │───▶│  Hospital       │
│ Creates Request │    │    Hospital     │    │ Receives Request│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                      │
                                                      ▼
                                              ┌─────────────────┐
                                              │ Hospital creates│
                                              │ donor request   │
                                              └─────────────────┘
                                                      │
                                                      ▼
                                         (Follows donation workflow)
```

### 4. Real-time Features

```
┌────────────────────────────────────────────────────────────────────┐
│                        SOCKET.IO EVENTS                            │
├────────────────────────────────────────────────────────────────────┤
│  EVENT              │  DESCRIPTION                                 │
├─────────────────────┼──────────────────────────────────────────────┤
│  register           │  User joins their personal room              │
│  new_request        │  Hospital creates urgent blood request       │
│  urgent_request     │  Broadcasted to all donors                   │
│  schedule_update    │  Schedule status changed                     │
│  donation_complete  │  Donation marked as complete                 │
└─────────────────────┴──────────────────────────────────────────────┘
```

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/PulseBank.git
cd PulseBank
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
cd Backend
npm install
cd ..
```

### 4. Set Up Environment Variables

Create `.env` in `Frontend`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Create `.env` in Backend directory:
```env
MONGO_URI=mongodb://localhost:27017/pulsebank
JWT_SECRET=your_jwt_secret
PORT=5000
FRONTEND_URL=http://localhost:3000
FRONTEND_URLS=http://localhost:3001

# Email Configuration (optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Twilio (Optional)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number
```

### 5. Start the Application

**Terminal 1 - Backend:**
```bash
cd Backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Access the application at `http://localhost:3000`

---

## 🔌 API Endpoints

### Authentication (`/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | User login |
| GET | `/auth/profile` | Get user profile |
| PUT | `/auth/profile` | Update user profile |

### Donor (`/donor`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/donor/profile` | Get donor profile |
| GET | `/donor/history` | Get donation history |
| GET | `/donor/stats` | Get donation statistics |
| POST | `/donor/schedule` | Schedule a donation |
| GET | `/donor/perks` | Get available perks |

### Hospital (`/hospital`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/hospital/requests` | Get hospital requests |
| POST | `/hospital/request` | Create blood request |
| GET | `/hospital/schedules` | Get donation schedules |
| PATCH | `/hospital/schedule/:id` | Update schedule status |
| GET | `/hospital/stats` | Get hospital statistics |

### Request (`/request`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/request` | Get all requests |
| GET | `/request/:id` | Get specific request |
| POST | `/request` | Create new request |
| PATCH | `/request/:id` | Update request status |
| DELETE | `/request/:id` | Cancel request |

### Schedule (`/schedule`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/schedule` | Create donation schedule |
| GET | `/schedule/donor/:id` | Get donor's schedules |
| PATCH | `/schedule/:id/status` | Update schedule status |
| PATCH | `/schedule/:id/complete` | Mark as completed |

---

## 📊 Database Models

### User
```javascript
{
  fullName: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  bloodType: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  role: ["donor", "hospital", "recipient", "user"],
  available: Boolean,
  location: { latitude: Number, longitude: Number },
  profileImage: String (base64),
  perks: [{ type, title, status, expiryDate }],
  totalDonations: Number
}
```


### Request
```javascript
{
  bloodType: String,
  unitsNeeded: Number,
  hospital: String,
  urgency: ["HIGH", "MODERATE", "LOW"],
  locationKm: Number,
  location: { latitude: Number, longitude: Number },
  status: ["Pending", "Fulfilled", "Cancelled"],
  requestedBy: ObjectId (ref: User),
  isRecipientRequest: Boolean
}
```

### DonationSchedule
```javascript
{
  donorId: ObjectId (ref: User),
  requestId: ObjectId (ref: Request),
  donorLocation: { latitude: Number, longitude: Number },
  contact: String,
  date: String,
  time: String,
  notes: String,
  status: ["pending", "accepted", "rejected", "completed"],
  hospitalResponse: ["none", "accepted", "rejected"]
}
```

### Donation
```javascript
{
  donorId: ObjectId (ref: User),
  hospital: String,
  units: Number,
  date: Date,
  status: ["Completed", "Pending", "Cancelled"]
}
```

---

## 🚢 Deployment

### Render
This project is prepared for Render with:

- [render.yaml](../render.yaml)
- [RENDER_DEPLOYMENT.md](../RENDER_DEPLOYMENT.md)

### Quick Deploy Checklist
1. Set up MongoDB Atlas cluster
2. Create the `pulsebank-api` and `pulsebank-web` services from `render.yaml`
3. Set backend `FRONTEND_URL` to your frontend Render URL
4. Set frontend `NEXT_PUBLIC_API_URL` to your backend Render URL
5. Redeploy both services after saving those URLs

---

## 🔐 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt encryption
- **CORS Protection**: Configured allowed origins
- **Input Validation**: Server-side validation
- **Route Guards**: Protected routes on frontend

---

## 📱 Key Features

| Feature | Description |
|---------|-------------|
| 🩸 Blood Request Management | Hospitals create and manage blood requests |
| 📅 Donation Scheduling | Donors schedule donations at their convenience |
| 🔔 Real-time Notifications | Instant alerts for urgent blood needs |
| 📍 Location-based Matching | Find nearby donors and hospitals |
| 🎁 Donor Rewards | Perks and health checkups for donors |
| 🤖 AI Chatbot | Assistance and FAQs |
| 📊 Statistics Dashboard | Track donations and impact |
| 📧 Email Notifications | Automated email alerts |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Authors

- **Pulse Bank Team**

---

<p align="center">
  Made with ❤️ for saving lives through smart blood donation
</p>
