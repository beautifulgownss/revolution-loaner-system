import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getReservations, getVehicles } from '../services/api';
import { formatDate, getStatusColor } from '../utils/helpers';

const Dashboard = () => {
  const [reservations, setReservations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const filterStatus = filter === 'all' ? null : filter;
      const [resResponse, vehResponse] = await Promise.all([
        getReservations(filterStatus),
        getVehicles(),
      ]);
      setReservations(resResponse.data);
      setVehicles(vehResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: reservations.length,
    reserved: reservations.filter(r => r.status === 'reserved').length,
    inUse: reservations.filter(r => r.status === 'in-use').length,
    returned: reservations.filter(r => r.status === 'returned').length,
    availableVehicles: vehicles.filter(v => v.status === 'available').length,
  };

  const StatCard = ({ title, value, icon, gradient, delay }) => (
    <div
      className={`stat-card ${gradient} animate-slide-up`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-white/80 mb-1">{title}</p>
          <p className="text-4xl font-black">{value}</p>
        </div>
        <div className="text-5xl opacity-20">{icon}</div>
      </div>
    </div>
  );

  const FilterButton = ({ label, value }) => (
    <button
      onClick={() => setFilter(value)}
      className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
        filter === value
          ? 'bg-revolution-primary text-white shadow-lg scale-105'
          : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600 text-lg">Manage your loaner vehicle reservations</p>
        </div>
        <Link to="/reservations/new" className="btn-primary shadow-xl">
          <span className="text-xl mr-2">+</span> New Reservation
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <StatCard
          title="Total Reservations"
          value={stats.total}
          icon="📊"
          gradient="from-blue-500 to-blue-600"
          delay={0}
        />
        <StatCard
          title="Reserved"
          value={stats.reserved}
          icon="📅"
          gradient="from-amber-500 to-orange-600"
          delay={100}
        />
        <StatCard
          title="In Use"
          value={stats.inUse}
          icon="🚗"
          gradient="from-green-500 to-emerald-600"
          delay={200}
        />
        <StatCard
          title="Returned"
          value={stats.returned}
          icon="✅"
          gradient="from-gray-500 to-gray-600"
          delay={300}
        />
        <StatCard
          title="Available Vehicles"
          value={stats.availableVehicles}
          icon="🔑"
          gradient="from-purple-500 to-indigo-600"
          delay={400}
        />
      </div>

      {/* Filters and Table */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Reservations</h2>
          <div className="flex space-x-3">
            <FilterButton label="All" value="all" />
            <FilterButton label="Reserved" value="reserved" />
            <FilterButton label="In Use" value="in-use" />
            <FilterButton label="Returned" value="returned" />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-revolution-primary border-t-transparent"></div>
            <p className="mt-4 text-gray-500 font-medium">Loading reservations...</p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl">
            <div className="text-6xl mb-4">🚗</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No reservations found</h3>
            <p className="text-gray-600 mb-6">Get started by creating your first reservation</p>
            <Link to="/reservations/new" className="btn-primary inline-block">
              Create Reservation
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="table-header">ID</th>
                    <th className="table-header">Customer</th>
                    <th className="table-header">Vehicle</th>
                    <th className="table-header">Start Date</th>
                    <th className="table-header">End Date</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reservations.map((reservation, index) => (
                    <tr
                      key={reservation.reservation_id}
                      className="hover:bg-blue-50 transition-colors animate-slide-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <td className="table-cell font-mono text-xs font-bold text-revolution-primary">
                        {reservation.reservation_id}
                      </td>
                      <td className="table-cell">
                        <div className="font-semibold text-gray-900">
                          {reservation.customer?.firstName} {reservation.customer?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{reservation.customer?.email}</div>
                      </td>
                      <td className="table-cell">
                        <div className="font-semibold text-gray-900">
                          {reservation.vehicle?.year} {reservation.vehicle?.model}
                        </div>
                        <div className="text-xs text-gray-500">{reservation.vehicle?.licensePlate}</div>
                      </td>
                      <td className="table-cell font-medium">{formatDate(reservation.start_date)}</td>
                      <td className="table-cell font-medium">{formatDate(reservation.end_date)}</td>
                      <td className="table-cell">
                        <span className={`badge ${getStatusColor(reservation.status)}`}>
                          {reservation.status === 'in-use' && '🚗 '}
                          {reservation.status === 'reserved' && '📅 '}
                          {reservation.status === 'returned' && '✅ '}
                          {reservation.status === 'cancelled' && '❌ '}
                          {reservation.status}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex space-x-2">
                          <Link
                            to={`/reservations/${reservation.reservation_id}`}
                            className="text-revolution-primary hover:text-blue-700 font-semibold text-sm hover:underline"
                          >
                            View
                          </Link>
                          {reservation.status === 'reserved' && (
                            <Link
                              to={`/reservations/${reservation.reservation_id}/checkout`}
                              className="text-green-600 hover:text-green-700 font-semibold text-sm hover:underline"
                            >
                              Check Out
                            </Link>
                          )}
                          {reservation.status === 'in-use' && (
                            <Link
                              to={`/reservations/${reservation.reservation_id}/checkin`}
                              className="text-orange-600 hover:text-orange-700 font-semibold text-sm hover:underline"
                            >
                              Check In
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
