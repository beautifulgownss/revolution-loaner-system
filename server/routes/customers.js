const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all customers
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Get single customer
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM customers WHERE customer_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// Search customers
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const result = await pool.query(
      `SELECT * FROM customers
       WHERE LOWER(first_name) LIKE LOWER($1)
          OR LOWER(last_name) LIKE LOWER($1)
          OR LOWER(email) LIKE LOWER($1)
          OR phone LIKE $1`,
      [`%${query}%`]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ error: 'Failed to search customers' });
  }
});

// Create new customer
router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      driversLicenseNumber,
      insuranceProvider,
      phone,
      email
    } = req.body;

    const customerId = `CUST${Date.now()}`;

    const result = await pool.query(
      `INSERT INTO customers (customer_id, first_name, last_name, date_of_birth,
       drivers_license_number, insurance_provider, phone, email)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [customerId, firstName, lastName, dateOfBirth, driversLicenseNumber, insuranceProvider, phone, email]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      dateOfBirth,
      driversLicenseNumber,
      insuranceProvider,
      phone,
      email
    } = req.body;

    const result = await pool.query(
      `UPDATE customers
       SET first_name = $1, last_name = $2, date_of_birth = $3,
           drivers_license_number = $4, insurance_provider = $5,
           phone = $6, email = $7, updated_at = CURRENT_TIMESTAMP
       WHERE customer_id = $8
       RETURNING *`,
      [firstName, lastName, dateOfBirth, driversLicenseNumber, insuranceProvider, phone, email, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

module.exports = router;
