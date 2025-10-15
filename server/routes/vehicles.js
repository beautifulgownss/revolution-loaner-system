const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all vehicles
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM vehicles';

    if (status) {
      query += ' WHERE status = $1';
      const result = await pool.query(query, [status]);
      return res.json(result.rows);
    }

    const result = await pool.query(query + ' ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// Get single vehicle
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM vehicles WHERE vehicle_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

// Create new vehicle
router.post('/', async (req, res) => {
  try {
    const { make, model, year, licensePlate, currentOdometer, currentFuelLevel } = req.body;
    const vehicleId = `VEH${Date.now()}`;

    const result = await pool.query(
      `INSERT INTO vehicles (vehicle_id, make, model, year, license_plate, current_odometer, current_fuel_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [vehicleId, make || 'Mercedes-Benz', model, year, licensePlate, currentOdometer || 0, currentFuelLevel || 'full']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

// Update vehicle
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { model, year, licensePlate, currentOdometer, currentFuelLevel, status } = req.body;

    const result = await pool.query(
      `UPDATE vehicles
       SET model = $1, year = $2, license_plate = $3, current_odometer = $4,
           current_fuel_level = $5, status = $6, updated_at = CURRENT_TIMESTAMP
       WHERE vehicle_id = $7
       RETURNING *`,
      [model, year, licensePlate, currentOdometer, currentFuelLevel, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

module.exports = router;
