import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createReservation, getVehicles, getAdvisors } from '../services/api';

const ReservationForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [advisors, setAdvisors] = useState([]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    driversLicenseNumber: '',
    insuranceProvider: '',
    phone: '',
    email: '',
    vehicleId: '',
    assignedAdvisorId: '',
    startDate: '',
    endDate: '',
    ageVerified: false,
    licenseVerified: false,
    insuranceVerified: false,
    waiverSigned: false,
  });

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [vehResponse, advResponse] = await Promise.all([
        getVehicles('available'),
        getAdvisors(),
      ]);
      setVehicles(vehResponse.data);
      setAdvisors(advResponse.data);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const requestData = {
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
          driversLicenseNumber: formData.driversLicenseNumber,
          insuranceProvider: formData.insuranceProvider,
          phone: formData.phone,
          email: formData.email,
        },
        vehicle: {
          vehicleId: formData.vehicleId,
        },
        reservationDetails: {
          startDate: formData.startDate,
          endDate: formData.endDate,
          assignedAdvisorId: formData.assignedAdvisorId,
        },
        eligibilityVerification: {
          ageVerified: formData.ageVerified,
          licenseVerified: formData.licenseVerified,
          insuranceVerified: formData.insuranceVerified,
          waiverSigned: formData.waiverSigned,
        },
      };

      await createReservation(requestData);
      navigate('/');
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('Failed to create reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const CheckboxField = ({ name, label, checked, onChange }) => (
    <label className="flex items-start space-x-3 p-4 rounded-xl border-2 border-gray-200 hover:border-revolution-primary hover:bg-blue-50 transition-all cursor-pointer group">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 text-revolution-primary border-gray-300 rounded focus:ring-revolution-primary mt-0.5"
      />
      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</span>
    </label>
  );

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 mb-2">Create New Reservation</h1>
        <p className="text-gray-600 text-lg">Fill in the details to create a loaner vehicle reservation</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-revolution-primary text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Customer Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="input-field"
                placeholder="John"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="input-field"
                placeholder="Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Driver's License Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="driversLicenseNumber"
                value={formData.driversLicenseNumber}
                onChange={handleChange}
                className="input-field"
                placeholder="DL123456789"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Insurance Provider <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="insuranceProvider"
                value={formData.insuranceProvider}
                onChange={handleChange}
                className="input-field"
                placeholder="State Farm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
                placeholder="(555) 123-4567"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="john.doe@email.com"
                required
              />
            </div>
          </div>
        </div>

        {/* Reservation Details */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-revolution-primary text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Reservation Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Vehicle <span className="text-red-500">*</span>
              </label>
              <select
                name="vehicleId"
                value={formData.vehicleId}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select a vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                    {vehicle.year} {vehicle.model} - {vehicle.license_plate}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Service Advisor <span className="text-red-500">*</span>
              </label>
              <select
                name="assignedAdvisorId"
                value={formData.assignedAdvisorId}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">Select an advisor</option>
                {advisors.map((advisor) => (
                  <option key={advisor.advisor_id} value={advisor.advisor_id}>
                    {advisor.first_name} {advisor.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          </div>
        </div>

        {/* Eligibility Verification */}
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-revolution-primary text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Eligibility Verification</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CheckboxField
              name="ageVerified"
              label="Age verified (21+ years old)"
              checked={formData.ageVerified}
              onChange={handleChange}
            />
            <CheckboxField
              name="licenseVerified"
              label="Driver's license verified"
              checked={formData.licenseVerified}
              onChange={handleChange}
            />
            <CheckboxField
              name="insuranceVerified"
              label="Insurance verified"
              checked={formData.insuranceVerified}
              onChange={handleChange}
            />
            <CheckboxField
              name="waiverSigned"
              label="Liability waiver signed"
              checked={formData.waiverSigned}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : (
              'Create Reservation'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReservationForm;
