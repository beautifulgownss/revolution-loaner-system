const pool = require('../config/db');

const createTables = async () => {
  try {
    console.log('Starting database migration...');

    // Create customers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        customer_id VARCHAR(50) PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        date_of_birth DATE NOT NULL,
        drivers_license_number VARCHAR(50) NOT NULL UNIQUE,
        insurance_provider VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Customers table created');

    // Create service_advisors table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_advisors (
        advisor_id VARCHAR(50) PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Service advisors table created');

    // Create vehicles table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        vehicle_id VARCHAR(50) PRIMARY KEY,
        make VARCHAR(50) DEFAULT 'Mercedes-Benz',
        model VARCHAR(100) NOT NULL,
        year INTEGER NOT NULL,
        license_plate VARCHAR(20) NOT NULL UNIQUE,
        current_odometer INTEGER DEFAULT 0,
        current_fuel_level VARCHAR(20) DEFAULT 'full' CHECK (current_fuel_level IN ('full', '3/4', 'half', '1/4', 'empty')),
        status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'in-use', 'maintenance')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Vehicles table created');

    // Create reservations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        reservation_id VARCHAR(50) PRIMARY KEY,
        customer_id VARCHAR(50) NOT NULL REFERENCES customers(customer_id),
        vehicle_id VARCHAR(50) NOT NULL REFERENCES vehicles(vehicle_id),
        assigned_advisor_id VARCHAR(50) NOT NULL REFERENCES service_advisors(advisor_id),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        check_out_timestamp TIMESTAMP,
        check_in_timestamp TIMESTAMP,
        status VARCHAR(20) DEFAULT 'reserved' CHECK (status IN ('reserved', 'in-use', 'returned', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Reservations table created');

    // Create eligibility_verification table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS eligibility_verification (
        verification_id SERIAL PRIMARY KEY,
        reservation_id VARCHAR(50) NOT NULL REFERENCES reservations(reservation_id),
        age_verified BOOLEAN DEFAULT false,
        license_verified BOOLEAN DEFAULT false,
        insurance_verified BOOLEAN DEFAULT false,
        waiver_signed BOOLEAN DEFAULT false,
        verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_by VARCHAR(50) REFERENCES service_advisors(advisor_id)
      );
    `);
    console.log('✓ Eligibility verification table created');

    // Create inspections table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inspections (
        inspection_id SERIAL PRIMARY KEY,
        reservation_id VARCHAR(50) NOT NULL REFERENCES reservations(reservation_id),
        inspection_type VARCHAR(20) NOT NULL CHECK (inspection_type IN ('pre-check', 'post-check')),
        odometer INTEGER NOT NULL,
        fuel_level VARCHAR(20) NOT NULL CHECK (fuel_level IN ('full', '3/4', 'half', '1/4', 'empty')),
        notes TEXT,
        inspected_by VARCHAR(50) REFERENCES service_advisors(advisor_id),
        inspected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Inspections table created');

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_reservations_customer ON reservations(customer_id);
      CREATE INDEX IF NOT EXISTS idx_reservations_vehicle ON reservations(vehicle_id);
      CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
      CREATE INDEX IF NOT EXISTS idx_inspections_reservation ON inspections(reservation_id);
      CREATE INDEX IF NOT EXISTS idx_eligibility_reservation ON eligibility_verification(reservation_id);
    `);
    console.log('✓ Database indexes created');

    console.log('\n✅ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
};

createTables();
