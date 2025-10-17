const http = require('http');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const { initSocket } = require('./socket');
const reservationsRouter = require('./routes/reservations.routes');
const vehiclesRouter = require('./routes/vehicles');
const customersRouter = require('./routes/customers');
const advisorsRouter = require('./routes/advisors');

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = initSocket(server);

app.set('io', io);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/reservations', reservationsRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/customers', customersRouter);
app.use('/api/advisors', advisorsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Revolution Loaner Management System API' });
});

server.listen(PORT, () => {
  console.log(`\n🚗 REVOLUTION - Loaner Vehicle Management System`);
  console.log(`🔧 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET    /api/health`);
  console.log(`  GET    /api/reservations`);
  console.log(`  POST   /api/reservations`);
  console.log(`  PUT    /api/reservations/:id`);
  console.log(`  DELETE /api/reservations/:id`);
  console.log(`  GET    /api/vehicles`);
  console.log(`  GET    /api/customers`);
  console.log(`  GET    /api/advisors\n`);
});
