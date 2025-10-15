const pool = require('../config/db');

const seedData = async () => {
  try {
    console.log('Starting database seeding...');

    // Seed service advisors
    await pool.query(`
      INSERT INTO service_advisors (advisor_id, first_name, last_name, email, phone)
      VALUES
        ('SA001', 'John', 'Smith', 'john.smith@mercedes.com', '555-0101'),
        ('SA002', 'Sarah', 'Johnson', 'sarah.johnson@mercedes.com', '555-0102'),
        ('SA003', 'Michael', 'Williams', 'michael.williams@mercedes.com', '555-0103')
      ON CONFLICT (advisor_id) DO NOTHING;
    `);
    console.log('✓ Service advisors seeded');

    // Seed customers
    await pool.query(`
      INSERT INTO customers (customer_id, first_name, last_name, date_of_birth, drivers_license_number, insurance_provider, phone, email)
      VALUES
        ('CUST001', 'Emily', 'Davis', '1985-03-15', 'DL123456789', 'State Farm', '555-1001', 'emily.davis@email.com'),
        ('CUST002', 'Robert', 'Martinez', '1990-07-22', 'DL987654321', 'Geico', '555-1002', 'robert.martinez@email.com'),
        ('CUST003', 'Jennifer', 'Garcia', '1988-11-30', 'DL456789123', 'Progressive', '555-1003', 'jennifer.garcia@email.com'),
        ('CUST004', 'David', 'Rodriguez', '1982-05-18', 'DL321654987', 'Allstate', '555-1004', 'david.rodriguez@email.com')
      ON CONFLICT (customer_id) DO NOTHING;
    `);
    console.log('✓ Customers seeded');

    // Seed vehicles
    await pool.query(`
      INSERT INTO vehicles (vehicle_id, make, model, year, license_plate, current_odometer, current_fuel_level, status)
      VALUES
        ('VEH001', 'Mercedes-Benz', 'C-Class', 2023, 'MB-C001', 5420, 'full', 'available'),
        ('VEH002', 'Mercedes-Benz', 'E-Class', 2024, 'MB-E001', 3200, 'full', 'available'),
        ('VEH003', 'Mercedes-Benz', 'GLE', 2023, 'MB-G001', 8150, '3/4', 'available'),
        ('VEH004', 'Mercedes-Benz', 'A-Class', 2024, 'MB-A001', 2100, 'full', 'available'),
        ('VEH005', 'Mercedes-Benz', 'GLC', 2023, 'MB-G002', 6800, 'half', 'available')
      ON CONFLICT (vehicle_id) DO NOTHING;
    `);
    console.log('✓ Vehicles seeded');

    // Seed a sample reservation
    await pool.query(`
      INSERT INTO reservations (reservation_id, customer_id, vehicle_id, assigned_advisor_id, start_date, end_date, status)
      VALUES
        ('RES001', 'CUST001', 'VEH001', 'SA001', CURRENT_DATE, CURRENT_DATE + INTERVAL '3 days', 'reserved')
      ON CONFLICT (reservation_id) DO NOTHING;
    `);
    console.log('✓ Sample reservation seeded');

    // Seed eligibility verification for the sample reservation
    await pool.query(`
      INSERT INTO eligibility_verification (reservation_id, age_verified, license_verified, insurance_verified, waiver_signed, verified_by)
      VALUES
        ('RES001', true, true, true, true, 'SA001')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✓ Eligibility verification seeded');

    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

seedData();
