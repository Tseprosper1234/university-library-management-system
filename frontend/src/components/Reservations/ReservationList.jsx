import React, { useState, useEffect } from 'react';
import { borrowingsAPI, reservationsAPI } from '../../services/api';

const ReservationList = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await reservationsAPI.getMyReservations();
      setReservations(response.data.reservations);
    } catch (error) {
      setError('Failed to fetch reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    try {
      await reservationsAPI.cancel(id);
      fetchReservations();
      alert('Reservation cancelled successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error cancelling reservation');
    }
  };

  const handleBorrowBook = async (bookId) => {
    try {
      const response = await borrowingsAPI.borrow(bookId);
      alert('Book borrowed successfully!');
      fetchReservations();
    } catch (error) {
      alert(error.response?.data?.message || 'Error borrowing book');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Reservations</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {reservations.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No reservations</h3>
          <p className="mt-1 text-sm text-gray-500">You haven't made any book reservations yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    reservation.status === 'fulfilled' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                  </span>
                  <span className="text-sm text-gray-500">
                    Reserved: {new Date(reservation.reservation_date).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {reservation.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  by {reservation.author}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  ISBN: {reservation.isbn}
                </p>
                
                {reservation.status === 'pending' && (
                  <div className="mt-4 space-y-2">
                    {reservation.expiry_date && (
                      <p className="text-sm text-gray-500">
                        Expires: {new Date(reservation.expiry_date).toLocaleString()}
                      </p>
                    )}
                    <div className="flex space-x-2">
                      {reservation.available_copies > 0 && (
                        <button
                          onClick={() => handleBorrowBook(reservation.book_id)}
                          className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Borrow Now
                        </button>
                      )}
                      <button
                        onClick={() => handleCancelReservation(reservation.id)}
                        className="flex-1 bg-red-100 text-red-700 px-4 py-2 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {reservation.status === 'fulfilled' && (
                  <div className="mt-4">
                    <p className="text-sm text-green-600">
                      Book is available! Visit the library to pick it up.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReservationList;