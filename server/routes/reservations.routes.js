const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const checkAvailability = require('../services/checkAvailability');

const RESERVATION_WITH_RELATIONS_QUERY = `
      SELECT
        r.*,
        json_build_object(
          'customerId', c.customer_id,
          'firstName', c.first_name,
          'lastName', c.last_name,
          'dateOfBirth', c.date_of_birth,
          'driversLicenseNumber', c.drivers_license_number,
          'insuranceProvider', c.insurance_provider,
          'phone', c.phone,
          'email', c.email
        ) as customer,
        json_build_object(
          'vehicleId', v.vehicle_id,
          'make', v.make,
          'model', v.model,
          'year', v.year,
          'licensePlate', v.license_plate,
          'currentOdometer', v.current_odometer,
          'currentFuelLevel', v.current_fuel_level
        ) as vehicle,
        json_build_object(
          'advisorId', sa.advisor_id,
          'firstName', sa.first_name,
          'lastName', sa.last_name,
          'email', sa.email
        ) as advisor,
        json_build_object(
          'ageVerified', COALESCE(ev.age_verified, false),
          'licenseVerified', COALESCE(ev.license_verified, false),
          'insuranceVerified', COALESCE(ev.insurance_verified, false),
          'waiverSigned', COALESCE(ev.waiver_signed, false)
        ) as eligibility
      FROM reservations r
      LEFT JOIN customers c ON r.customer_id = c.customer_id
      LEFT JOIN vehicles v ON r.vehicle_id = v.vehicle_id
      LEFT JOIN service_advisors sa ON r.assigned_advisor_id = sa.advisor_id
      LEFT JOIN eligibility_verification ev ON r.reservation_id = ev.reservation_id
`;

const INSPECTIONS_QUERY = `
  SELECT *
  FROM inspections
  WHERE reservation_id = $1
  ORDER BY inspected_at DESC
`;

/**
 * Fetch a single reservation row along with joined relational data.
 *
 * @param {string} reservationId
 * @param {import('pg').PoolClient|import('pg').Pool} db
 * @returns {Promise<Object|null>}
 */
async function fetchReservationWithRelations(reservationId, db = pool) {
  const { rows } = await db.query(
    `${RESERVATION_WITH_RELATIONS_QUERY} WHERE r.reservation_id = $1`,
    [reservationId]
  );

  if (!rows.length) {
    return null;
  }

  const reservation = rows[0];
  const inspections = await db.query(INSPECTIONS_QUERY, [reservationId]);
  reservation.inspections = inspections.rows;

  return reservation;
}

/**
 * Emit a reservation update event to all connected clients.
 *
 * @param {import('express').Request} req
 * @param {'create'|'update'|'delete'} action
 * @param {Object} payload
 */
function emitReservationUpdate(req, action, payload) {
  const io = req.app.get('io');
  if (io) {
    io.emit('reservation_update', { action, data: payload });
  }
}

// Get all reservations with full details
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = RESERVATION_WITH_RELATIONS_QUERY;
    const params = [];

    if (status) {
      query += ` WHERE r.status = $1`;
      params.push(status);
    }

    query += ' ORDER BY r.start_date ASC, r.end_date ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
});

// Get single reservation by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await fetchReservationWithRelations(id);

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.json(reservation);
  } catch (error) {
    console.error('Error fetching reservation:', error);
    res.status(500).json({ error: 'Failed to fetch reservation' });
  }
});

// Create new reservation
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { customer, vehicle, reservationDetails, eligibilityVerification } = req.body;

    const vehicleId = vehicle?.vehicleId || req.body.vehicleId;
    const startDate = reservationDetails?.startDate || req.body.startDate;
    const endDate = reservationDetails?.endDate || req.body.endDate;
    const assignedAdvisorId =
      reservationDetails?.assignedAdvisorId || req.body.assignedAdvisorId;
    const status = reservationDetails?.status || req.body.status || 'reserved';

    if (!vehicleId || !startDate || !endDate || !assignedAdvisorId) {
      await client.query('ROLLBACK');
      return res
        .status(400)
        .json({ error: 'vehicleId, startDate, endDate, and assignedAdvisorId are required' });
    }

    const conflicts = await checkAvailability({
      vehicleId,
      startDate,
      endDate,
      client,
    });

    if (conflicts.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'Vehicle is already reserved for the selected time range',
        conflicts,
      });
    }

    let customerId;
    if (customer) {
      customerId = customer.customerId || `CUST${Date.now()}`;
      const customerCheck = await client.query(
        'SELECT customer_id FROM customers WHERE customer_id = $1',
        [customerId]
      );

      if (customerCheck.rows.length === 0) {
        await client.query(
          `INSERT INTO customers (customer_id, first_name, last_name, date_of_birth,
           drivers_license_number, insurance_provider, phone, email)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            customerId,
            customer.firstName,
            customer.lastName,
            customer.dateOfBirth,
            customer.driversLicenseNumber,
            customer.insuranceProvider,
            customer.phone,
            customer.email,
          ]
        );
      }
    } else if (req.body.customerId) {
      customerId = req.body.customerId;
      const existingCustomer = await client.query(
        'SELECT customer_id FROM customers WHERE customer_id = $1',
        [customerId]
      );

      if (existingCustomer.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Customer does not exist' });
      }
    } else {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Customer information is required' });
    }

    const reservationId = `RES${Date.now()}`;
    await client.query(
      `INSERT INTO reservations (reservation_id, customer_id, vehicle_id, assigned_advisor_id,
       start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [reservationId, customerId, vehicleId, assignedAdvisorId, startDate, endDate, status]
    );

    if (eligibilityVerification) {
      await client.query(
        `INSERT INTO eligibility_verification (reservation_id, age_verified, license_verified,
         insurance_verified, waiver_signed, verified_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          reservationId,
          eligibilityVerification.ageVerified,
          eligibilityVerification.licenseVerified,
          eligibilityVerification.insuranceVerified,
          eligibilityVerification.waiverSigned,
          assignedAdvisorId,
        ]
      );
    }

    const createdReservation = await fetchReservationWithRelations(reservationId, client);

    await client.query('COMMIT');

    emitReservationUpdate(req, 'create', createdReservation);

    res.status(201).json(createdReservation);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating reservation:', error);
    res.status(500).json({ error: 'Failed to create reservation' });
  } finally {
    client.release();
  }
});

// Update reservation details
router.put('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const existingReservationResult = await client.query(
      'SELECT reservation_id, vehicle_id, assigned_advisor_id, start_date, end_date, status FROM reservations WHERE reservation_id = $1',
      [id]
    );

    if (existingReservationResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const existing = existingReservationResult.rows[0];
    const vehicleId = req.body.vehicleId || existing.vehicle_id;
    const assignedAdvisorId = req.body.assignedAdvisorId || existing.assigned_advisor_id;
    const startDate = req.body.startDate || existing.start_date;
    const endDate = req.body.endDate || existing.end_date;
    const status = req.body.status || existing.status;

    if (!vehicleId || !startDate || !endDate || !assignedAdvisorId) {
      await client.query('ROLLBACK');
      return res
        .status(400)
        .json({ error: 'vehicleId, startDate, endDate, and assignedAdvisorId are required' });
    }

    const conflicts = await checkAvailability({
      vehicleId,
      startDate,
      endDate,
      excludeReservationId: id,
      client,
    });

    if (conflicts.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'Vehicle is already reserved for the selected time range',
        conflicts,
      });
    }

    await client.query(
      `UPDATE reservations
       SET vehicle_id = $1,
           assigned_advisor_id = $2,
           start_date = $3,
           end_date = $4,
           status = $5,
           updated_at = CURRENT_TIMESTAMP
       WHERE reservation_id = $6`,
      [vehicleId, assignedAdvisorId, startDate, endDate, status, id]
    );

    const updatedReservation = await fetchReservationWithRelations(id, client);

    await client.query('COMMIT');

    emitReservationUpdate(req, 'update', updatedReservation);

    res.json(updatedReservation);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating reservation:', error);
    res.status(500).json({ error: 'Failed to update reservation' });
  } finally {
    client.release();
  }
});

// Update reservation status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      'UPDATE reservations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE reservation_id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const updatedReservation = await fetchReservationWithRelations(id);

    emitReservationUpdate(req, 'update', updatedReservation);

    res.json(updatedReservation);
  } catch (error) {
    console.error('Error updating reservation status:', error);
    res.status(500).json({ error: 'Failed to update reservation status' });
  }
});

// Check-out vehicle
router.post('/:id/checkout', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { inspection } = req.body;

    // Update reservation
    await client.query(
      `UPDATE reservations
       SET status = 'in-use', check_out_timestamp = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE reservation_id = $1`,
      [id]
    );

    // Get vehicle_id
    const reservationResult = await client.query(
      'SELECT vehicle_id FROM reservations WHERE reservation_id = $1',
      [id]
    );
    const vehicleId = reservationResult.rows[0].vehicle_id;

    // Update vehicle status
    await client.query(
      `UPDATE vehicles
       SET status = 'in-use', current_odometer = $1, current_fuel_level = $2, updated_at = CURRENT_TIMESTAMP
       WHERE vehicle_id = $3`,
      [inspection.preCheck.odometer, inspection.preCheck.fuelLevel, vehicleId]
    );

    // Create pre-check inspection
    await client.query(
      `INSERT INTO inspections (reservation_id, inspection_type, odometer, fuel_level, notes, inspected_by)
       VALUES ($1, 'pre-check', $2, $3, $4, $5)`,
      [id, inspection.preCheck.odometer, inspection.preCheck.fuelLevel, inspection.preCheck.notes, inspection.inspectedBy]
    );

    const updatedReservation = await fetchReservationWithRelations(id, client);

    await client.query('COMMIT');

    emitReservationUpdate(req, 'update', updatedReservation);

    res.json({ message: 'Vehicle checked out successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error checking out vehicle:', error);
    res.status(500).json({ error: 'Failed to check out vehicle' });
  } finally {
    client.release();
  }
});

// Check-in vehicle
router.post('/:id/checkin', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { inspection } = req.body;

    // Update reservation
    await client.query(
      `UPDATE reservations
       SET status = 'returned', check_in_timestamp = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE reservation_id = $1`,
      [id]
    );

    // Get vehicle_id
    const reservationResult = await client.query(
      'SELECT vehicle_id FROM reservations WHERE reservation_id = $1',
      [id]
    );
    const vehicleId = reservationResult.rows[0].vehicle_id;

    // Update vehicle status
    await client.query(
      `UPDATE vehicles
       SET status = 'available', current_odometer = $1, current_fuel_level = $2, updated_at = CURRENT_TIMESTAMP
       WHERE vehicle_id = $3`,
      [inspection.postCheck.odometer, inspection.postCheck.fuelLevel, vehicleId]
    );

    // Create post-check inspection
    await client.query(
      `INSERT INTO inspections (reservation_id, inspection_type, odometer, fuel_level, notes, inspected_by)
       VALUES ($1, 'post-check', $2, $3, $4, $5)`,
      [id, inspection.postCheck.odometer, inspection.postCheck.fuelLevel, inspection.postCheck.notes, inspection.inspectedBy]
    );

    const updatedReservation = await fetchReservationWithRelations(id, client);

    await client.query('COMMIT');

    emitReservationUpdate(req, 'update', updatedReservation);

    res.json({ message: 'Vehicle checked in successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error checking in vehicle:', error);
    res.status(500).json({ error: 'Failed to check in vehicle' });
  } finally {
    client.release();
  }
});

// Delete reservation
router.delete('/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const reservation = await fetchReservationWithRelations(id, client);

    if (!reservation) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Reservation not found' });
    }

    await client.query('DELETE FROM reservations WHERE reservation_id = $1', [id]);
    await client.query('COMMIT');

    emitReservationUpdate(req, 'delete', reservation);

    res.json({ message: 'Reservation deleted successfully', reservationId: id });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting reservation:', error);
    res.status(500).json({ error: 'Failed to delete reservation' });
  } finally {
    client.release();
  }
});

module.exports = router;
