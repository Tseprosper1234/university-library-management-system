import React, { useState, useEffect } from 'react';
import { borrowingsAPI } from '../../services/api';

const MyBorrowings = () => {
  const [borrowings, setBorrowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBorrowings();
  }, [filter]);

  const fetchBorrowings = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await borrowingsAPI.getMyBorrowings(params);
      setBorrowings(response.data.borrowings);
    } catch (error) {
      console.error('Error fetching borrowings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (borrowingId) => {
    if (!window.confirm('Are you sure you want to return this book?')) {
      return;
    }

    try {
      const response = await borrowingsAPI.return(borrowingId);
      alert(response.data.message);
      fetchBorrowings();
    } catch (error) {
      alert(error.response?.data?.message || 'Error returning book');
    }
  };

  const handleRenew = async (borrowingId) => {
    if (!window.confirm('Renew this book for another 14 days?')) {
      return;
    }

    try {
      const response = await borrowingsAPI.renew(borrowingId);
      alert(response.data.message);
      fetchBorrowings();
    } catch (error) {
      alert(error.response?.data?.message || 'Error renewing book');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'returned': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Borrowings</h1>

      {/* Filter Buttons */}
      <div className="mb-6">
        <nav className="flex space-x-4">
          {['all', 'active', 'overdue', 'returned'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
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

      {/* Borrowings List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : borrowings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No borrowings</h3>
          <p className="mt-1 text-sm text-gray-500">You haven't borrowed any books yet.</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {borrowings.map((borrowing) => (
              <li key={borrowing.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {borrowing.title}
                      </h3>
                      <span className={`ml-3 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(borrowing.status)}`}>
                        {borrowing.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">by {borrowing.author}</p>
                    <p className="text-sm text-gray-500">ISBN: {borrowing.isbn}</p>
                    
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-gray-500">Borrowed:</span>
                        <p className="text-sm text-gray-900">
                          {new Date(borrowing.borrow_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Due Date:</span>
                        <p className={`text-sm ${borrowing.status === 'overdue' ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                          {new Date(borrowing.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      {borrowing.return_date && (
                        <div>
                          <span className="text-xs text-gray-500">Returned:</span>
                          <p className="text-sm text-gray-900">
                            {new Date(borrowing.return_date).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {borrowing.fine_amount > 0 && (
                        <div>
                          <span className="text-xs text-gray-500">Fine:</span>
                          <p className="text-sm text-yellow-600 font-semibold">
                            ${parseFloat(borrowing.fine_amount).toFixed(2)}
                            {borrowing.fine_paid ? ' (Paid)' : ' (Unpaid)'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-6 flex-shrink-0 flex space-x-2">
                    {(borrowing.status === 'active' || borrowing.status === 'overdue') && (
                      <>
                        <button
                          onClick={() => handleRenew(borrowing.id)}
                          disabled={borrowing.renewed}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                          title={borrowing.renewed ? 'Already renewed' : 'Renew for 14 days'}
                        >
                          Renew
                        </button>
                        <button
                          onClick={() => handleReturn(borrowing.id)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                        >
                          Return
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MyBorrowings;