const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, authorize } = require('../middleware/auth');
const emailService = require('../services/emailService');

// Reserve a book
router.post('/', authenticateToken, async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { bookId } = req.body;
    const userId = req.user.id;

    // Check if book exists
    const bookResult = await client.query(
      'SELECT * FROM books WHERE id = $1',
      [bookId]
    );

    if (bookResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    const book = bookResult.rows[0];

    // Check if user already has this book reserved
    const existingReservation = await client.query(
      `SELECT * FROM reservations 
       WHERE user_id = $1 AND book_id = $2 AND status = 'pending'`,
      [userId, bookId]
    );

    if (existingReservation.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'You already have a pending reservation for this book'
      });
    }

    // Check if book is available (no need to reserve if available)
    if (book.available_copies > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Book is currently available. You can borrow it directly.',
        available: true
      });
    }

    // Check reservation limit (max 3 reservations)
    const activeReservations = await client.query(
      `SELECT COUNT(*) FROM reservations 
       WHERE user_id = $1 AND status = 'pending'`,
      [userId]
    );

    if (parseInt(activeReservations.rows[0].count) >= 3) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'You have reached the maximum reservation limit (3 books)'
      });
    }

    // Set reservation expiry (48 hours from now)
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 48);

    // Create reservation
    const result = await client.query(
      `INSERT INTO reservations (user_id, book_id, status, expiry_date)
       VALUES ($1, $2, 'pending', $3)
       RETURNING *`,
      [userId, bookId, expiryDate]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Book reserved successfully. You will be notified when it becomes available.',
      reservation: result.rows[0],
      expiryDate
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reserve book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error reserving book'
    });
  } finally {
    client.release();
  }
});

// Get user's reservations
router.get('/my-reservations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT r.*, bk.title, bk.author, bk.isbn, bk.cover_image_url, bk.available_copies
      FROM reservations r
      JOIN books bk ON r.book_id = bk.id
      WHERE r.user_id = $1
    `;
    const params = [userId];

    if (status) {
      query += ' AND r.status = $2';
      params.push(status);
    }

    query += ' ORDER BY r.reservation_date DESC';

    const result = await db.query(query, params);

    res.json({
      success: true,
      reservations: result.rows
    });
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reservations'
    });
  }
});

// Cancel reservation
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if reservation exists and belongs to user
    const reservationResult = await db.query(
      `SELECT * FROM reservations 
       WHERE id = $1 AND user_id = $2 AND status = 'pending'`,
      [id, userId]
    );

    if (reservationResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found or already processed'
      });
    }

    // Cancel reservation
    const result = await db.query(
      `UPDATE reservations 
       SET status = 'cancelled' 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    res.json({
      success: true,
      message: 'Reservation cancelled successfully',
      reservation: result.rows[0]
    });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error cancelling reservation'
    });
  }
});

// Get all reservations (Admin only)
router.get('/all', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT r.*, u.email, u.first_name, u.last_name, u.student_id,
             bk.title as book_title, bk.author as book_author, bk.available_copies
      FROM reservations r
      JOIN users u ON r.user_id = u.id
      JOIN books bk ON r.book_id = bk.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND r.status = $1';
      params.push(status);
    }

    query += ` ORDER BY r.reservation_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Count total
    let countQuery = 'SELECT COUNT(*) FROM reservations WHERE 1=1';
    const countParams = [];
    if (status) {
      countQuery += ' AND status = $1';
      countParams.push(status);
    }
    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      reservations: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get all reservations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reservations'
    });
  }
});

// Fulfill reservation (Admin only - when book becomes available)
router.put('/:id/fulfill', authenticateToken, authorize('admin'), async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;

    // Get reservation details
    const reservationResult = await client.query(
      `SELECT r.*, u.email, bk.title
       FROM reservations r
       JOIN users u ON r.user_id = u.id
       JOIN books bk ON r.book_id = bk.id
       WHERE r.id = $1 AND r.status = 'pending'`,
      [id]
    );

    if (reservationResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Reservation not found or already processed'
      });
    }

    const reservation = reservationResult.rows[0];

    // Update reservation status
    await client.query(
      `UPDATE reservations 
       SET status = 'fulfilled' 
       WHERE id = $1`,
      [id]
    );

    // Send notification email
    await emailService.sendReservationAvailable(
      reservation.email,
      reservation.title
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Reservation fulfilled successfully. User has been notified.',
      reservation: reservationResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Fulfill reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fulfilling reservation'
    });
  } finally {
    client.release();
  }
});

// Check for expired reservations and cancel them
router.post('/check-expired', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE reservations 
       SET status = 'cancelled' 
       WHERE status = 'pending' AND expiry_date < CURRENT_TIMESTAMP
       RETURNING *`
    );

    res.json({
      success: true,
      message: `Cancelled ${result.rows.length} expired reservations`,
      cancelledReservations: result.rows
    });
  } catch (error) {
    console.error('Check expired reservations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking expired reservations'
    });
  }
});

// Get reservation statistics (Admin only)
router.get('/stats', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const stats = {};

    const totalPendingResult = await db.query(
      "SELECT COUNT(*) FROM reservations WHERE status = 'pending'"
    );
    stats.totalPending = parseInt(totalPendingResult.rows[0].count);

    const totalFulfilledResult = await db.query(
      "SELECT COUNT(*) FROM reservations WHERE status = 'fulfilled'"
    );
    stats.totalFulfilled = parseInt(totalFulfilledResult.rows[0].count);

    const totalCancelledResult = await db.query(
      "SELECT COUNT(*) FROM reservations WHERE status = 'cancelled'"
    );
    stats.totalCancelled = parseInt(totalCancelledResult.rows[0].count);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get reservation stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching reservation stats'
    });
  }
});

module.exports = router;