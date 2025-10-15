# Quick Setup Guide

## Step-by-Step Setup Instructions

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

### 2. Set Up PostgreSQL Database

```bash
# Create the database (run these commands in psql)
psql -U postgres

CREATE DATABASE loaner_system;
\q
```

### 3. Configure Environment

The `.env` file is already created with default settings. Update if needed:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=loaner_system
DB_USER=postgres
DB_PASSWORD=postgres  # Change this to your PostgreSQL password
PORT=5000
```

### 4. Run Migrations and Seed Data

```bash
# Create all database tables
npm run migrate

# Add sample data (optional but recommended)
npm run seed
```

### 5. Start the Application

```bash
# Start both backend and frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Default Seed Data

After running `npm run seed`, you'll have:

### Service Advisors
- John Smith (SA001)
- Sarah Johnson (SA002)
- Michael Williams (SA003)

### Vehicles
- 2023 Mercedes-Benz C-Class (MB-C001)
- 2024 Mercedes-Benz E-Class (MB-E001)
- 2023 Mercedes-Benz GLE (MB-G001)
- 2024 Mercedes-Benz A-Class (MB-A001)
- 2023 Mercedes-Benz GLC (MB-G002)

### Sample Customer
- Emily Davis with an active reservation

## Testing the System

1. **View Dashboard**: Navigate to http://localhost:3000 to see the dashboard with the sample reservation

2. **Create a Reservation**:
   - Click "New Reservation"
   - Fill in customer details
   - Select a vehicle and advisor
   - Complete eligibility verification

3. **Check Out a Vehicle**:
   - Find a "reserved" reservation
   - Click "Check Out"
   - Complete the pre-inspection form

4. **Check In a Vehicle**:
   - Find an "in-use" reservation
   - Click "Check In"
   - Complete the post-inspection form

## Troubleshooting

### "Database does not exist"
Run: `psql -U postgres -c "CREATE DATABASE loaner_system;"`

### "Port 5000 already in use"
Change PORT in `.env` to a different port (e.g., 5001)

### "Port 3000 already in use"
Run: `PORT=3001 npm start` in the client directory

### PostgreSQL connection refused
- Make sure PostgreSQL is running
- Verify credentials in `.env`
- Check PostgreSQL is listening on port 5432

## Next Steps

- Customize the branding in `client/tailwind.config.js`
- Add more vehicles through the API or database
- Modify the database schema if needed
- Deploy to production server

Enjoy your Mercedes-Benz Loaner Reservation System!
