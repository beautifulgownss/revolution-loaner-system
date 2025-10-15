const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all service advisors
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM service_advisors ORDER BY first_name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching advisors:', error);
    res.status(500).json({ error: 'Failed to fetch advisors' });
  }
});

// Get single advisor
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM service_advisors WHERE advisor_id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Advisor not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching advisor:', error);
    res.status(500).json({ error: 'Failed to fetch advisor' });
  }
});

module.exports = router;
