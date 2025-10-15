# Mercedes-Benz Loaner Vehicle Reservation System

A comprehensive full-stack application for managing Mercedes-Benz loaner vehicle reservations, built with Node.js/Express, PostgreSQL, React, and Tailwind CSS.

## Features

### Backend (Node.js/Express + PostgreSQL)
- RESTful API for managing reservations, vehicles, customers, and service advisors
- Complete database schema with relationships
- Transaction support for data integrity
- Database migrations and seeding

### Frontend (React + Tailwind CSS)
- Service advisor dashboard with statistics
- Create and manage reservations
- Vehicle check-out workflow with pre-inspection
- Vehicle check-in workflow with post-inspection
- Comprehensive reservation details view
- Responsive design with Mercedes-Benz branding

### Data Model
- **Customers**: Personal info, driver's license, insurance
- **Vehicles**: Mercedes-Benz fleet management
- **Reservations**: Booking details and status tracking
- **Inspections**: Pre/post check documentation
- **Eligibility Verification**: Age, license, insurance, waiver checks
- **Service Advisors**: Staff management

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

### 1. Clone and Install Dependencies

```bash
cd loaner-reservation-system

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
# Access PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE loaner_system;

# Exit psql
\q
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=loaner_system
DB_USER=postgres
DB_PASSWORD=your_password
PORT=5000
```

### 4. Run Database Migrations

```bash
npm run migrate
```

### 5. Seed the Database (Optional)

```bash
npm run seed
```

This will create:
- 3 service advisors
- 4 sample customers
- 5 loaner vehicles
- 1 sample reservation

## Running the Application

### Development Mode (Concurrent Backend + Frontend)

```bash
npm run dev
```

This starts:
- Backend API on http://localhost:5000
- React frontend on http://localhost:3000

### Production Mode

```bash
# Build frontend
cd client
npm run build
cd ..

# Start backend
npm start
```

## API Endpoints

### Reservations
- `GET /api/reservations` - Get all reservations (optional ?status filter)
- `GET /api/reservations/:id` - Get reservation details
- `POST /api/reservations` - Create new reservation
- `PATCH /api/reservations/:id/status` - Update reservation status
- `POST /api/reservations/:id/checkout` - Check out vehicle
- `POST /api/reservations/:id/checkin` - Check in vehicle

### Vehicles
- `GET /api/vehicles` - Get all vehicles (optional ?status filter)
- `GET /api/vehicles/:id` - Get vehicle details
- `POST /api/vehicles` - Create new vehicle
- `PUT /api/vehicles/:id` - Update vehicle

### Customers
- `GET /api/customers` - Get all customers
- `GET /api/customers/:id` - Get customer details
- `GET /api/customers/search/:query` - Search customers
- `POST /api/customers` - Create new customer
- `PUT /api/customers/:id` - Update customer

### Service Advisors
- `GET /api/advisors` - Get all advisors
- `GET /api/advisors/:id` - Get advisor details

## Project Structure

```
loaner-reservation-system/
├── server/
│   ├── config/
│   │   └── db.js                 # Database configuration
│   ├── migrations/
│   │   ├── migrate.js            # Database schema creation
│   │   └── seed.js               # Sample data seeding
│   ├── routes/
│   │   ├── reservations.js       # Reservation endpoints
│   │   ├── vehicles.js           # Vehicle endpoints
│   │   ├── customers.js          # Customer endpoints
│   │   └── advisors.js           # Advisor endpoints
│   └── index.js                  # Express server setup
├── client/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.js         # App layout with nav
│   │   │   ├── Dashboard.js      # Main dashboard
│   │   │   ├── ReservationForm.js    # New reservation
│   │   │   ├── ReservationDetails.js # Reservation view
│   │   │   ├── CheckOutForm.js   # Vehicle check-out
│   │   │   └── CheckInForm.js    # Vehicle check-in
│   │   ├── services/
│   │   │   └── api.js            # API service layer
│   │   ├── utils/
│   │   │   └── helpers.js        # Utility functions
│   │   ├── App.js                # Main app component
│   │   ├── index.js              # React entry point
│   │   └── index.css             # Tailwind styles
│   ├── package.json
│   └── tailwind.config.js
├── package.json
├── .env.example
└── README.md
```

## Database Schema

### Tables
- `customers` - Customer information
- `service_advisors` - Service advisor details
- `vehicles` - Loaner vehicle fleet
- `reservations` - Reservation records
- `eligibility_verification` - Customer eligibility checks
- `inspections` - Pre/post check inspections

## Usage Guide

### Creating a Reservation

1. Click "New Reservation" in the navigation
2. Fill in customer information
3. Select an available vehicle
4. Choose a service advisor
5. Set start and end dates
6. Complete eligibility verification checkboxes
7. Submit the reservation

### Checking Out a Vehicle

1. Find the reservation in the dashboard
2. Click "Check Out" for a reserved vehicle
3. Record odometer reading
4. Select fuel level
5. Add inspection notes (document any existing damage)
6. Select the inspecting advisor
7. Complete check-out

### Checking In a Vehicle

1. Find the active reservation in the dashboard
2. Click "Check In" for an in-use vehicle
3. Record return odometer reading
4. Select fuel level
5. Add inspection notes (document any new damage)
6. Select the inspecting advisor
7. Complete check-in

## Customization

### Adding Custom Branding

Edit `client/tailwind.config.js` to customize colors:

```javascript
colors: {
  'mb-gray': '#1a1a1a',
  'mb-silver': '#c0c0c0',
  'mb-blue': '#00adef',
}
```

### Modifying Vehicle Models

Add or update vehicle records through the API or directly in the database.

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `.env` file
- Ensure database exists: `psql -U postgres -l`

### Port Already in Use
- Backend: Change `PORT` in `.env`
- Frontend: Set `PORT=3001` before running `npm start`

### CORS Errors
- Verify `client/package.json` has `"proxy": "http://localhost:5000"`

## Future Enhancements

- [ ] Email notifications for reservations
- [ ] SMS reminders for returns
- [ ] Photo upload for inspections
- [ ] Digital signature capture for waivers
- [ ] Reporting and analytics dashboard
- [ ] Integration with dealership CRM
- [ ] Mobile app version
- [ ] Real-time availability calendar

## License

MIT License

## Support

For issues or questions, please contact your system administrator.
