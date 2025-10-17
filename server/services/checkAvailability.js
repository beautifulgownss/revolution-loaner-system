const pool = require('../config/db');

/**
 * Check if a vehicle has any conflicting reservations within the supplied date range.
 *
 * @param {Object} params - Availability check parameters.
 * @param {string} params.vehicleId - The vehicle to validate.
 * @param {string|Date} params.startDate - Desired reservation start date.
 * @param {string|Date} params.endDate - Desired reservation end date.
 * @param {string} [params.excludeReservationId] - Reservation to exclude from overlap detection (useful during updates).
 * @param {import('pg').PoolClient} [params.client] - Optional transaction client to execute the query with.
 * @returns {Promise<Array>} - List of conflicting reservations (empty array when available).
 */
async function checkAvailability({
  vehicleId,
  startDate,
  endDate,
  excludeReservationId,
  client,
}) {
  if (!vehicleId || !startDate || !endDate) {
    throw new Error('vehicleId, startDate, and endDate are required to check availability');
  }

  const executor = client || pool;
  const params = [vehicleId, startDate, endDate];
  let query = `
    SELECT reservation_id, customer_id, start_date, end_date
    FROM reservations
    WHERE vehicle_id = $1
      AND start_date < $3
      AND end_date > $2
  `;

  if (excludeReservationId) {
    query += ' AND reservation_id <> $4';
    params.push(excludeReservationId);
  }

  query += ' ORDER BY start_date ASC';

  const { rows } = await executor.query(query, params);
  return rows;
}

module.exports = checkAvailability;
