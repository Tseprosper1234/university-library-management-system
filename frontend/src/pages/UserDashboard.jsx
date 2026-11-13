import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../services/api';

const UserDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await usersAPI.getDashboard();
      if (response.data.success) {
        setDashboard(response.data.dashboard);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's an overview of your library activity.
        </p>
      </div>

      {/* Statistics Cards */}
      {dashboard?.stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Borrowings</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboard.stats.active_count}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Overdue Books</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboard.stats.overdue_count}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Fines</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ${parseFloat(dashboard.stats.total_fines || 0).toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Reservations</dt>
                    <dd className="text-lg font-medium text-gray-900">{dashboard.stats.pending_reservations}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Borrowings */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Current Borrowings</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Books you currently have borrowed.</p>
          </div>
          <Link to="/my-borrowings" className="text-sm text-indigo-600 hover:text-indigo-900">
            View All →
          </Link>
        </div>
        {dashboard?.activeBorrowings?.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {dashboard.activeBorrowings.map((borrowing) => (
              <li key={borrowing.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-indigo-600 truncate">{borrowing.title}</p>
                    <p className="text-sm text-gray-500">by {borrowing.author}</p>
                    <p className="text-sm text-gray-500">
                      Due: {new Date(borrowing.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      borrowing.status === 'overdue' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {borrowing.status === 'overdue' ? 'Overdue' : 'Active'}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-8 text-center text-gray-500">
            <p>No active borrowings</p>
            <Link to="/books" className="mt-2 inline-flex items-center text-indigo-600 hover:text-indigo-900">
              Browse Books →
            </Link>
          </div>
        )}
      </div>

      {/* Pending Reservations */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Pending Reservations</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Books you've reserved.</p>
          </div>
          <Link to="/my-reservations" className="text-sm text-indigo-600 hover:text-indigo-900">
            View All →
          </Link>
        </div>
        {dashboard?.pendingReservations?.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {dashboard.pendingReservations.map((reservation) => (
              <li key={reservation.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-indigo-600 truncate">{reservation.title}</p>
                    <p className="text-sm text-gray-500">by {reservation.author}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-8 text-center text-gray-500">
            <p>No pending reservations</p>
          </div>
        )}
      </div>

      {/* Recent Returns */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Returns</h3>
        </div>
        {dashboard?.recentReturns?.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {dashboard.recentReturns.map((borrowing) => (
              <li key={borrowing.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{borrowing.title}</p>
                    <p className="text-sm text-gray-500">
                      Returned: {new Date(borrowing.return_date).toLocaleDateString()}
                    </p>
                  </div>
                  {borrowing.fine_amount > 0 && (
                    <div className="ml-4 flex-shrink-0">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Fine: ${borrowing.fine_amount}
                      </span>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-8 text-center text-gray-500">
            <p>No recent returns</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;