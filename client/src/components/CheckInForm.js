import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReservation, checkInVehicle, getAdvisors } from '../services/api';
import { getFuelLevelDisplay } from '../utils/helpers';

const CheckInForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [advisors, setAdvisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [inspectionData, setInspectionData] = useState({
    odometer: '',
    fuelLevel: 'full',
    notes: '',
    inspectedBy: '',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [resResponse, advResponse] = await Promise.all([
        getReservation(id),
        getAdvisors(),
      ]);
      setReservation(resResponse.data);
      setAdvisors(advResponse.data);

      // Pre-fill inspector
      if (resResponse.data.assigned_advisor_id) {
        setInspectionData(prev => ({
          ...prev,
          inspectedBy: resResponse.data.assigned_advisor_id,
        }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Failed to load reservation');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInspectionData({
      ...inspectionData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const requestData = {
        inspection: {
          postCheck: {
            odometer: parseInt(inspectionData.odometer),
            fuelLevel: inspectionData.fuelLevel,
            notes: inspectionData.notes,
          },
          inspectedBy: inspectionData.inspectedBy,
        },
      };

      await checkInVehicle(id, requestData);
      alert('Vehicle checked in successfully!');
      navigate(`/reservations/${id}`);
    } catch (error) {
      console.error('Error checking in vehicle:', error);
      alert('Failed to check in vehicle. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // Get pre-check inspection data
  const preInspection = reservation?.inspections?.find(i => i.inspection_type === 'pre-check');
  const milesDriven = inspectionData.odometer && preInspection
    ? parseInt(inspectionData.odometer) - preInspection.odometer
    : 0;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Vehicle Check-In</h2>

        {/* Reservation Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2">Reservation Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Customer:</span>{' '}
              <span className="font-medium">
                {reservation.customer?.firstName} {reservation.customer?.lastName}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Vehicle:</span>{' '}
              <span className="font-medium">
                {reservation.vehicle?.year} {reservation.vehicle?.model}
              </span>
            </div>
          </div>
        </div>

        {/* Pre-Check Reference */}
        {preInspection && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-3">Check-Out Condition (Reference)</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <span className="text-blue-600">Odometer:</span>{' '}
                <span className="font-medium">{preInspection.odometer?.toLocaleString()} miles</span>
              </div>
              <div>
                <span className="text-blue-600">Fuel Level:</span>{' '}
                <span className="font-medium">{getFuelLevelDisplay(preInspection.fuel_level)}</span>
              </div>
              {preInspection.notes && (
                <div className="col-span-2">
                  <span className="text-blue-600">Notes:</span>{' '}
                  <span className="font-medium">{preInspection.notes}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post-Check Inspection */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Return Inspection
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Odometer Reading *
                </label>
                <input
                  type="number"
                  name="odometer"
                  value={inspectionData.odometer}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter current odometer reading"
                  required
                />
                {milesDriven > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    Miles driven: {milesDriven.toLocaleString()}
                  </p>
                )}
                {inspectionData.odometer && preInspection && parseInt(inspectionData.odometer) < preInspection.odometer && (
                  <p className="text-sm text-red-600 mt-1">
                    ⚠ Warning: Odometer reading is less than check-out reading
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fuel Level *
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {['full', '3/4', 'half', '1/4', 'empty'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setInspectionData({ ...inspectionData, fuelLevel: level })}
                      className={`py-2 px-4 rounded-lg border-2 transition-all ${
                        inspectionData.fuelLevel === level
                          ? 'border-mb-blue bg-mb-blue text-white'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {level === '3/4' ? '3/4' : level === 'half' ? '1/2' : level === '1/4' ? '1/4' : level}
                    </button>
                  ))}
                </div>
                {preInspection && inspectionData.fuelLevel !== preInspection.fuel_level && (
                  <p className="text-sm text-yellow-600 mt-1">
                    ⚠ Fuel level different from check-out ({getFuelLevelDisplay(preInspection.fuel_level)})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Return Inspection Notes
                </label>
                <textarea
                  name="notes"
                  value={inspectionData.notes}
                  onChange={handleChange}
                  className="input-field"
                  rows="4"
                  placeholder="Document any new damage, issues found, cleanliness concerns, or other observations..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Compare vehicle condition to pre-check. Note any new damage or issues.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Inspected By *
                </label>
                <select
                  name="inspectedBy"
                  value={inspectionData.inspectedBy}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">Select service advisor</option>
                  {advisors.map((advisor) => (
                    <option key={advisor.advisor_id} value={advisor.advisor_id}>
                      {advisor.first_name} {advisor.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-900 mb-3">Return Checklist</h4>
            <ul className="space-y-2 text-sm text-orange-800">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Inspect vehicle for new damage compared to check-out condition</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Check interior for cleanliness and personal belongings</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Verify all keys, accessories, and documents are returned</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Document fuel level and mileage accurately</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Review any issues with customer and get acknowledgment</span>
              </li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate(`/reservations/${id}`)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Complete Check-In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckInForm;
