import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Reservations
export const getReservations = (status) => {
  const params = status ? { status } : {};
  return api.get('/reservations', { params });
};

export const getReservation = (id) => api.get(`/reservations/${id}`);

export const createReservation = (data) => api.post('/reservations', data);

export const updateReservationStatus = (id, status) =>
  api.patch(`/reservations/${id}/status`, { status });

export const checkOutVehicle = (id, inspectionData) =>
  api.post(`/reservations/${id}/checkout`, inspectionData);

export const checkInVehicle = (id, inspectionData) =>
  api.post(`/reservations/${id}/checkin`, inspectionData);

// Vehicles
export const getVehicles = (status) => {
  const params = status ? { status } : {};
  return api.get('/vehicles', { params });
};

export const getVehicle = (id) => api.get(`/vehicles/${id}`);

export const createVehicle = (data) => api.post('/vehicles', data);

// Customers
export const getCustomers = () => api.get('/customers');

export const getCustomer = (id) => api.get(`/customers/${id}`);

export const searchCustomers = (query) => api.get(`/customers/search/${query}`);

export const createCustomer = (data) => api.post('/customers', data);

// Advisors
export const getAdvisors = () => api.get('/advisors');

export const getAdvisor = (id) => api.get(`/advisors/${id}`);

export default api;
