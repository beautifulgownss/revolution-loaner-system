import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getReservation } from '../services/api';
import { formatDate, formatDateTime, getStatusColor, getFuelLevelDisplay } from '../utils/helpers';

const ReservationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservation();
  }, [id]);

  const fetchReservation = async () => {
    try {
      const response = await getReservation(id);
      setReservation(response.data);
    } catch (error) {
      console.error('Error fetching reservation:', error);
      alert('Failed to load reservation details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading reservation details...</div>
      </div>
    );
  }

  if (!reservation) {
    return null;
  }

  const preInspection = reservation.inspections?.find(i => i.inspection_type === 'pre-check');
  const postInspection = reservation.inspections?.find(i => i.inspection_type === 'post-check');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">Reservation Details</h2>
            <p className="text-gray-600">ID: {reservation.reservation_id}</p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`badge ${getStatusColor(reservation.status)} text-lg`}>
              {reservation.status}
            </span>
            {reservation.status === 'reserved' && (
              <Link
                to={`/reservations/${id}/checkout`}
                className="btn-primary"
              >
                Check Out Vehicle
              </Link>
            )}
            {reservation.status === 'in-use' && (
              <Link
                to={`/reservations/${id}/checkin`}
                className="btn-primary"
              >
                Check In Vehicle
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Customer Information */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4">Customer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="font-medium">
              {reservation.customer?.firstName} {reservation.customer?.lastName}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date of Birth</p>
            <p className="font-medium">{formatDate(reservation.customer?.dateOfBirth)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Driver's License</p>
            <p className="font-medium">{reservation.customer?.driversLicenseNumber}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Insurance Provider</p>
            <p className="font-medium">{reservation.customer?.insuranceProvider}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phone</p>
            <p className="font-medium">{reservation.customer?.phone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{reservation.customer?.email}</p>
          </div>
        </div>
      </div>

      {/* Vehicle Information */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4">Vehicle Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Vehicle</p>
            <p className="font-medium">
              {reservation.vehicle?.year} {reservation.vehicle?.make} {reservation.vehicle?.model}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">License Plate</p>
            <p className="font-medium">{reservation.vehicle?.licensePlate}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Current Odometer</p>
            <p className="font-medium">{reservation.vehicle?.currentOdometer?.toLocaleString()} miles</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fuel Level</p>
            <p className="font-medium">{getFuelLevelDisplay(reservation.vehicle?.currentFuelLevel)}</p>
          </div>
        </div>
      </div>

      {/* Reservation Details */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4">Reservation Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Start Date</p>
            <p className="font-medium">{formatDate(reservation.start_date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">End Date</p>
            <p className="font-medium">{formatDate(reservation.end_date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Service Advisor</p>
            <p className="font-medium">
              {reservation.advisor?.firstName} {reservation.advisor?.lastName}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Advisor Email</p>
            <p className="font-medium">{reservation.advisor?.email}</p>
          </div>
          {reservation.check_out_timestamp && (
            <div>
              <p className="text-sm text-gray-600">Check-Out Time</p>
              <p className="font-medium">{formatDateTime(reservation.check_out_timestamp)}</p>
            </div>
          )}
          {reservation.check_in_timestamp && (
            <div>
              <p className="text-sm text-gray-600">Check-In Time</p>
              <p className="font-medium">{formatDateTime(reservation.check_in_timestamp)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Eligibility Verification */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4">Eligibility Verification</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <div className={`w-5 h-5 rounded-full ${reservation.eligibility?.ageVerified ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">Age Verified</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-5 h-5 rounded-full ${reservation.eligibility?.licenseVerified ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">License Verified</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-5 h-5 rounded-full ${reservation.eligibility?.insuranceVerified ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">Insurance Verified</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-5 h-5 rounded-full ${reservation.eligibility?.waiverSigned ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">Waiver Signed</span>
          </div>
        </div>
      </div>

      {/* Inspections */}
      {(preInspection || postInspection) && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Inspections</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {preInspection && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-600 mb-3">Pre-Check Inspection</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Odometer</p>
                    <p className="font-medium">{preInspection.odometer?.toLocaleString()} miles</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fuel Level</p>
                    <p className="font-medium">{getFuelLevelDisplay(preInspection.fuel_level)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="font-medium">{preInspection.notes || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Inspected At</p>
                    <p className="font-medium">{formatDateTime(preInspection.inspected_at)}</p>
                  </div>
                </div>
              </div>
            )}
            {postInspection && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-600 mb-3">Post-Check Inspection</h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Odometer</p>
                    <p className="font-medium">{postInspection.odometer?.toLocaleString()} miles</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fuel Level</p>
                    <p className="font-medium">{getFuelLevelDisplay(postInspection.fuel_level)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="font-medium">{postInspection.notes || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Inspected At</p>
                    <p className="font-medium">{formatDateTime(postInspection.inspected_at)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="flex justify-start">
        <button onClick={() => navigate('/')} className="btn-secondary">
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ReservationDetails;
