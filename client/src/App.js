import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ReservationForm from './components/ReservationForm';
import ReservationDetails from './components/ReservationDetails';
import CheckOutForm from './components/CheckOutForm';
import CheckInForm from './components/CheckInForm';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/reservations/new" element={<ReservationForm />} />
          <Route path="/reservations/:id" element={<ReservationDetails />} />
          <Route path="/reservations/:id/checkout" element={<CheckOutForm />} />
          <Route path="/reservations/:id/checkin" element={<CheckInForm />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
