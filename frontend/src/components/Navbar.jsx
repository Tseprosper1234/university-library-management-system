import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'bg-indigo-700 text-white' : 'text-white hover:bg-indigo-500 hover:bg-opacity-75';
  };

  // Don't show navbar on auth pages
  const authPages = ['/login', '/register', '/forgot-password'];
  if (authPages.includes(location.pathname) || location.pathname.includes('/verify-email')) {
    return null;
  }

  return (
    <nav className="bg-indigo-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to={isAdmin ? '/admin/dashboard' : '/dashboard'} className="flex items-center">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="ml-2 text-white font-bold text-lg hidden sm:block">
                  University Library
                </span>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {isAdmin ? (
                  <>
                    <Link
                      to="/admin/dashboard"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin/dashboard')}`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/books"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin/books')}`}
                    >
                      Books
                    </Link>
                    <Link
                      to="/admin/users"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin/users')}`}
                    >
                      Users
                    </Link>
                    <Link
                      to="/admin/borrowings"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin/borrowings')}`}
                    >
                      Borrowings
                    </Link>
                    <Link
                      to="/admin/reservations"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin/reservations')}`}
                    >
                      Reservations
                    </Link>
                    <Link
                      to="/admin/fines"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin/fines')}`}
                    >
                      Fines
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/dashboard"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard')}`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/books"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/books')}`}
                    >
                      Browse Books
                    </Link>
                    <Link
                      to="/my-borrowings"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/my-borrowings')}`}
                    >
                      My Borrowings
                    </Link>
                    <Link
                      to="/my-reservations"
                      className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/my-reservations')}`}
                    >
                      My Reservations
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* User Menu */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="max-w-xs bg-indigo-600 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white"
                >
                  <span className="sr-only">Open user menu</span>
                  <div className="h-8 w-8 rounded-full bg-indigo-400 flex items-center justify-center text-white font-medium">
                    {user?.firstName?.charAt(0) || 'U'}
                  </div>
                  <span className="ml-2 text-white text-sm hidden lg:block">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <svg className="ml-1 h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <span className={`mt-1 inline-flex text-xs px-2 py-0.5 rounded-full ${
                        isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user?.role}
                      </span>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Your Profile
                    </Link>
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        handleLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <div className="flex items-center">
                        <svg className="mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sign out
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-indigo-700">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {isAdmin ? (
              <>
                <Link
                  to="/admin/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600"
                >
                  Dashboard
                </Link>
                <Link
                  to="/admin/books"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600"
                >
                  Books
                </Link>
                <Link
                  to="/admin/users"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600"
                >
                  Users
                </Link>
                <Link
                  to="/admin/borrowings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600"
                >
                  Borrowings
                </Link>
                <Link
                  to="/admin/reservations"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600"
                >
                  Reservations
                </Link>
                <Link
                  to="/admin/fines"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600"
                >
                  Fines
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600"
                >
                  Dashboard
                </Link>
                <Link
                  to="/books"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600"
                >
                  Browse Books
                </Link>
                <Link
                  to="/my-borrowings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600"
                >
                  My Borrowings
                </Link>
                <Link
                  to="/my-reservations"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600"
                >
                  My Reservations
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile User Menu */}
          <div className="pt-4 pb-3 border-t border-indigo-500">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-indigo-400 flex items-center justify-center text-white font-medium">
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-white">{user?.firstName} {user?.lastName}</div>
                <div className="text-sm font-medium text-indigo-300">{user?.email}</div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600"
              >
                Your Profile
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white hover:bg-indigo-600"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;