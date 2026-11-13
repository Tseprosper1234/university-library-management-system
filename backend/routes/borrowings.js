const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, authorize } = require('../middleware/auth');
const emailService = require('../services/emailService');

// Borrow a book
router.post('/borrow', authenticateToken, async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    // Check book availability
    const bookResult = await db.query(
      'SELECT * FROM books WHERE id = $1',
      [bookId]
    );

    if (bookResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    const book = bookResult.rows[0];

    if (book.available_copies <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Book is not available for borrowing'
      });
    }

    // Check if user already borrowed this book
    const existingBorrow = await db.query(
      'SELECT * FROM borrowings WHERE user_id = $1 AND book_id = $2 AND status = $3',
      [userId, bookId, 'active']
    );

    if (existingBorrow.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already borrowed this book'
      });
    }

    // Check borrowing limit (max 3 books)
    const activeBorrows = await db.query(
      'SELECT COUNT(*) FROM borrowings WHERE user_id = $1 AND status IN ($2, $3)',
      [userId, 'active', 'overdue']
    );

    if (parseInt(activeBorrows.rows[0].count) >= 3) {
      return res.status(400).json({
        success: false,
        message: 'You have reached the maximum borrowing limit (3 books)'
      });
    }

    // Calculate due date (14 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    // Create borrowing record
    const borrowResult = await db.query(
      `INSERT INTO borrowings (user_id, book_id, due_date, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, bookId, dueDate, 'active']
    );

    // Update available copies
    await db.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1',
      [bookId]
    );

    // Get user email for notification
    const userResult = await db.query(
      'SELECT email, first_name FROM users WHERE id = $1',
      [userId]
    );

    // Send confirmation email
    await emailService.sendBorrowConfirmation(
      userResult.rows[0].email,
      book.title,
      dueDate
    );

    res.status(201).json({
      success: true,
      message: 'Book borrowed successfully',
      borrowing: borrowResult.rows[0],
      dueDate: dueDate
    });
  } catch (error) {
    console.error('Borrow book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error borrowing book'
    });
  }
});

// Return a book
router.post('/return/:borrowingId', authenticateToken, async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { borrowingId } = req.params;
    const userId = req.user.id;

    // Get borrowing record
    const borrowResult = await client.query(
      'SELECT * FROM borrowings WHERE id = $1 AND user_id = $2',
      [borrowingId, userId]
    );

    if (borrowResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Borrowing record not found'
      });
    }

    const borrowing = borrowResult.rows[0];

    if (borrowing.status === 'returned') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Book already returned'
      });
    }

    // Calculate fine if overdue
    const now = new Date();
    const dueDate = new Date(borrowing.due_date);
    let fineAmount = 0;

    if (now > dueDate) {
      const daysOverdue = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
      fineAmount = daysOverdue * 0.50; // $0.50 per day
    }

    // Update borrowing record
    const updateResult = await client.query(
      `UPDATE borrowings 
       SET return_date = CURRENT_TIMESTAMP, 
           status = 'returned', 
           fine_amount = $1,
           fine_paid = $2
       WHERE id = $3 
       RETURNING *`,
      [fineAmount, fineAmount === 0, borrowingId]
    );

    // Update book available copies
    await client.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id = $1',
      [borrowing.book_id]
    );

    // If there's a fine, create fine record
    if (fineAmount > 0) {
      await client.query(
        `INSERT INTO fines (user_id, borrowing_id, amount, status)
         VALUES ($1, $2, $3, 'unpaid')`,
        [userId, borrowingId, fineAmount]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: fineAmount > 0 ? `Book returned with late fine of $${fineAmount.toFixed(2)}` : 'Book returned successfully',
      borrowing: updateResult.rows[0],
      fineAmount
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Return book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error returning book'
    });
  } finally {
    client.release();
  }
});

// Get user's borrowings
router.get('/my-borrowings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT b.*, bk.title, bk.author, bk.isbn, bk.cover_image_url
      FROM borrowings b
      JOIN books bk ON b.book_id = bk.id
      WHERE b.user_id = $1
    `;
    const params = [userId];

    if (status) {
      query += ' AND b.status = $2';
      params.push(status);
    }

    query += ' ORDER BY b.borrow_date DESC';

    const result = await db.query(query, params);

    res.json({
      success: true,
      borrowings: result.rows
    });
  } catch (error) {
    console.error('Get borrowings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching borrowings'
    });
  }
});

// Renew a book
router.post('/renew/:borrowingId', authenticateToken, async (req, res) => {
  try {
    const { borrowingId } = req.params;
    const userId = req.user.id;

    // Get borrowing record
    const borrowResult = await db.query(
      'SELECT * FROM borrowings WHERE id = $1 AND user_id = $2 AND status = $3',
      [borrowingId, userId, 'active']
    );

    if (borrowResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Active borrowing record not found'
      });
    }

    const borrowing = borrowResult.rows[0];

    if (borrowing.renewed) {
      return res.status(400).json({
        success: false,
        message: 'Book has already been renewed once'
      });
    }

    // Extend due date by 14 days
    const newDueDate = new Date(borrowing.due_date);
    newDueDate.setDate(newDueDate.getDate() + 14);

    const result = await db.query(
      `UPDATE borrowings 
       SET due_date = $1, renewed = true 
       WHERE id = $2 
       RETURNING *`,
      [newDueDate, borrowingId]
    );

    res.json({
      success: true,
      message: 'Book renewed successfully',
      borrowing: result.rows[0]
    });
  } catch (error) {
    console.error('Renew book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error renewing book'
    });
  }
});

// Get all borrowings (Admin only)
router.get('/all', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT b.*, u.email, u.first_name, u.last_name, u.student_id,
             bk.title as book_title, bk.author as book_author, bk.isbn
      FROM borrowings b
      JOIN users u ON b.user_id = u.id
      JOIN books bk ON b.book_id = bk.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND b.status = $1';
      params.push(status);
    }

    query += ' ORDER BY b.borrow_date DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Count total
    let countQuery = 'SELECT COUNT(*) FROM borrowings WHERE 1=1';
    if (status) {
      countQuery += ' AND status = $1';
    }
    const countResult = await db.query(countQuery, status ? [status] : []);

    res.json({
      success: true,
      borrowings: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get all borrowings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching borrowings'
    });
  }
});

module.exports = router;