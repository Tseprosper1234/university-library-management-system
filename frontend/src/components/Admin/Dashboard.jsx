import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminders = async () => {
    try {
      await adminAPI.sendOverdueReminders();
      alert('Overdue reminders sent successfully');
      fetchDashboardStats();
    } catch (error) {
      alert('Error sending reminders');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!stats) {
    return <div>Error loading dashboard</div>;
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Books</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalBooks}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Available Books</h3>
          <p className="text-3xl font-bold text-green-600">{stats.availableBooks}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Active Borrowings</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.activeBorrowings}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Overdue Books</h3>
          <p className="text-3xl font-bold text-red-600">{stats.overdueBooks}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.totalUsers}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium">Unpaid Fines</h3>
          <p className="text-3xl font-bold text-orange-600">${stats.totalUnpaidFines.toFixed(2)}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-8">
        <button
          onClick={handleSendReminders}
          className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
        >
          Send Overdue Reminders
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Books Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Most Popular Books</h3>
          <BarChart width={500} height={300} data={stats.popularBooks.slice(0, 5)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="title" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="borrow_count" fill="#8884d8" name="Times Borrowed" />
          </BarChart>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Books by Category</h3>
          <PieChart width={400} height={300}>
            <Pie
              data={stats.categoryDistribution}
              cx={200}
              cy={150}
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
              nameKey="category"
              label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
            >
              {stats.categoryDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Borrow Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.recentActivities.map((activity) => (
                <tr key={activity.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {activity.first_name} {activity.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{activity.book_title}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(activity.borrow_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      activity.status === 'active' ? 'bg-green-100 text-green-800' :
                      activity.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {activity.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;