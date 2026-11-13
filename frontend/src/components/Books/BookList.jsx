import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { booksAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchBooks();
  }, [search, category, availableOnly, page]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        search,
        category: category || undefined,
        available: availableOnly ? 'true' : undefined,
      };
      
      const response = await booksAPI.getAll(params);
      setBooks(response.data.books);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBooks();
  };

  const handleReserve = async (bookId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ bookId })
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Book reserved successfully!');
        fetchBooks();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Error reserving book');
    }
  };

  const handleBorrow = async (bookId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/borrowings/borrow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ bookId })
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Book borrowed successfully!');
        fetchBooks();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Error borrowing book');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Library Books</h1>
        {isAdmin && (
          <Link
            to="/admin/books"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Manage Books
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-8">
        <form onSubmit={handleSearch} className="space-y-4 sm:space-y-0 sm:flex sm:space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by title, author, or ISBN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Engineering">Engineering</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Literature">Literature</option>
              <option value="History">History</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="availableOnly"
              checked={availableOnly}
              onChange={(e) => { setAvailableOnly(e.target.checked); setPage(1); }}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="availableOnly" className="ml-2 text-sm text-gray-700">
              Available only
            </label>
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No books found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {books.map((book) => (
              <div key={book.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="h-48 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                  {book.cover_image_url ? (
                    <img src={book.cover_image_url} alt={book.title} className="h-full w-full object-cover" />
                  ) : (
                    <svg className="h-20 w-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                  <p className="text-xs text-gray-500 mb-3">ISBN: {book.isbn}</p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      book.available_copies > 0 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {book.available_copies > 0 ? `${book.available_copies} Available` : 'Unavailable'}
                    </span>
                    {book.category && (
                      <span className="text-xs text-gray-500">{book.category}</span>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Link
                      to={`/books/${book.id}`}
                      className="flex-1 text-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Details
                    </Link>
                    {book.available_copies > 0 ? (
                      <button
                        onClick={() => handleBorrow(book.id)}
                        className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                      >
                        Borrow
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReserve(book.id)}
                        className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded-md text-sm font-medium hover:bg-yellow-600"
                      >
                        Reserve
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                      page === i + 1
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BookList;