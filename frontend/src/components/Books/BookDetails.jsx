import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { booksAPI } from '../../services/api';

const BookDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);

  useEffect(() => {
    fetchBook();
  }, [id]);

  const fetchBook = async () => {
    try {
      const response = await booksAPI.getById(id);
      setBook(response.data.book);
    } catch (error) {
      console.error('Error fetching book:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    setBorrowing(true);
    try {
      const response = await fetch(`http://localhost:5000/api/borrowings/borrow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ bookId: id })
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Book borrowed successfully! Due date: ' + new Date(data.dueDate).toLocaleDateString());
        fetchBook();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Error borrowing book');
    } finally {
      setBorrowing(false);
    }
  };

  const handleReserve = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ bookId: id })
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Book reserved successfully!');
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Error reserving book');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Book not found</h1>
        <button onClick={() => navigate('/books')} className="mt-4 text-indigo-600 hover:text-indigo-900">
          ← Back to Books
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => navigate('/books')} className="mb-6 text-indigo-600 hover:text-indigo-900 flex items-center">
        <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Books
      </button>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="md:flex">
          <div className="md:flex-shrink-0 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center p-12">
            {book.cover_image_url ? (
              <img src={book.cover_image_url} alt={book.title} className="h-64 w-48 object-cover rounded-lg shadow-lg" />
            ) : (
              <svg className="h-32 w-32 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            )}
          </div>
          <div className="p-8 flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{book.title}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Author</h3>
                <p className="mt-1 text-lg text-gray-900">{book.author}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">ISBN</h3>
                <p className="mt-1 text-lg text-gray-900">{book.isbn}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Publisher</h3>
                <p className="mt-1 text-lg text-gray-900">{book.publisher || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Publication Year</h3>
                <p className="mt-1 text-lg text-gray-900">{book.publication_year || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Edition</h3>
                <p className="mt-1 text-lg text-gray-900">{book.edition || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Category</h3>
                <p className="mt-1 text-lg text-gray-900">{book.category || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Shelf Location</h3>
                <p className="mt-1 text-lg text-gray-900">{book.shelf_location || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Availability</h3>
                <p className="mt-1">
                  <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                    book.available_copies > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {book.available_copies > 0 
                      ? `${book.available_copies} of ${book.total_copies} available` 
                      : 'Currently unavailable'}
                  </span>
                </p>
              </div>
            </div>

            {book.description && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-2 text-gray-900">{book.description}</p>
              </div>
            )}

            <div className="mt-8 flex space-x-4">
              {book.available_copies > 0 ? (
                <button
                  onClick={handleBorrow}
                  disabled={borrowing}
                  className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 font-medium"
                >
                  {borrowing ? 'Processing...' : 'Borrow This Book'}
                </button>
              ) : (
                <button
                  onClick={handleReserve}
                  className="flex-1 bg-yellow-500 text-white px-6 py-3 rounded-md hover:bg-yellow-600 font-medium"
                >
                  Reserve This Book
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetails;