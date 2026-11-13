import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const FineManagement = () => {
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('unpaid');

  useEffect(() => {
    fetchFines();
  }, [filter]);

  const fetchFines = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getFines(filter);
      setFines(response.data.fines);
    } catch (error) {
      console.error('Error fetching fines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayFine = async (id) => {
    if (!window.confirm('Mark this fine as paid?')) return;
    
    try {
      await adminAPI.payFine(id);
      alert('Fine marked as paid');
      fetchFines();
    } catch (error) {
      alert(error.response?.data?.message || 'Error processing payment');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Fine Management</h1>

      {/* Filter Buttons */}
      <div className="mb-6">
        <nav className="flex space-x-4">
          {['unpaid', 'paid', 'waived'].map((status) => (
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

      {/* Fines Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : fines.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No {filter} fines found</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fines.map((fine) => (
                <tr key={fine.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {fine.first_name} {fine.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{fine.email}</div>
                    {fine.student_id && (
                      <div className="text-sm text-gray-500">ID: {fine.student_id}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {fine.book_title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-yellow-600">
                    ${parseFloat(fine.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      fine.status === 'paid' ? 'bg-green-100 text-green-800' :
                      fine.status === 'waived' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {fine.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(fine.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {fine.status === 'unpaid' && (
                      <button
                        onClick={() => handlePayFine(fine.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FineManagement;