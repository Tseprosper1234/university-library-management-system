import React, { useState, useEffect } from 'react';
import { reservationsAPI } from '../../services/api';

const ReservationManagement = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReservations, setTotalReservations] = useState(0);

  useEffect(() => {
    fetchReservations();
  }, [filter, page]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await reservationsAPI.getAll({ status: filter, page, limit: 20 });
      setReservations(response.data.reservations);
      setTotalReservations(response.data.total);
      setTotalPages(Math.ceil(response.data.total / 20));
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFulfill = async (id) => {
    if (!window.confirm('Mark this reservation as fulfilled and notify the user?')) {
      return;
    }

    try {
      await reservationsAPI.fulfill(id);
      alert('Reservation fulfilled successfully. User has been notified.');
      fetchReservations();
    } catch (error) {
      alert(error.response?.data?.message || 'Error fulfilling reservation');
    }
  };

  const handleCheckExpired = async () => {
    try {
      const response = await reservationsAPI.checkExpired();
      alert(response.data.message);
      fetchReservations();
    } catch (error) {
      alert('Error checking expired reservations');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reservation Management</h1>
        <div className="mt-4 sm:mt-0 space-x-3">
          <button
            onClick={handleCheckExpired}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Check Expired Reservations
          </button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="mb-6">
        <nav className="flex space-x-4">
          {['pending', 'fulfilled', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => { setFilter(status); setPage(1); }}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === status
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Reservations Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No {filter} reservations found</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Book
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reserved Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reservations.map((reservation) => (
                <tr key={reservation.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {reservation.first_name} {reservation.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{reservation.email}</div>
                    {reservation.student_id && (
                      <div className="text-sm text-gray-500">ID: {reservation.student_id}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {reservation.book_title}
                    </div>
                    <div className="text-sm text-gray-500">
                      by {reservation.book_author}
                    </div>
                    {reservation.available_copies !== undefined && (
                      <div className="text-sm text-gray-500">
                        Available: {reservation.available_copies}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(reservation.reservation_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reservation.expiry_date 
                      ? new Date(reservation.expiry_date).toLocaleString()
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(reservation.status)}`}>
                      {reservation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {reservation.status === 'pending' && (
                      <button
                        onClick={() => handleFulfill(reservation.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Fulfill
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <p className="text-sm text-gray-700">
            Showing {Math.min(page * 20, totalReservations)} of {totalReservations} reservations
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="px-4 py-2 border rounded-md disabled:opacity-50 hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationManagement;