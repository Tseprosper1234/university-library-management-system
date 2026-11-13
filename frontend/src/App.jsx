import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import VerifyEmail from './components/Auth/VerifyEmail';
import UserDashboard from './pages/UserDashboard';
import UserProfile from './pages/UserProfile';
import BookList from './components/Books/BookList';
import BookDetails from './components/Books/BookDetails';
import MyBorrowings from './components/Borrowings/MyBorrowings';
import ReservationList from './components/Reservations/ReservationList';
import AdminDashboard from './components/Admin/Dashboard';
import BookManagement from './components/Admin/BookManagement';
import UserManagement from './components/Admin/UserManagement';
import FineManagement from './components/Admin/FineManagement';
import ReservationManagement from './components/Admin/ReservationManagement';
import AllBorrowings from './components/Admin/AllBorrowings';

// Protected Route Component
const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

// Public Route
const PublicRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />

            {/* User Routes */}
            <Route path="/dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
            <Route path="/books" element={<PrivateRoute><BookList /></PrivateRoute>} />
            <Route path="/books/:id" element={<PrivateRoute><BookDetails /></PrivateRoute>} />
            <Route path="/my-borrowings" element={<PrivateRoute><MyBorrowings /></PrivateRoute>} />
            <Route path="/my-reservations" element={<PrivateRoute><ReservationList /></PrivateRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/dashboard" element={<PrivateRoute adminOnly><AdminDashboard /></PrivateRoute>} />
            <Route path="/admin/books" element={<PrivateRoute adminOnly><BookManagement /></PrivateRoute>} />
            <Route path="/admin/users" element={<PrivateRoute adminOnly><UserManagement /></PrivateRoute>} />
            <Route path="/admin/borrowings" element={<PrivateRoute adminOnly><AllBorrowings /></PrivateRoute>} />
            <Route path="/admin/reservations" element={<PrivateRoute adminOnly><ReservationManagement /></PrivateRoute>} />
            <Route path="/admin/fines" element={<PrivateRoute adminOnly><FineManagement /></PrivateRoute>} />

            {/* Default Routes */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;