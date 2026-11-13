const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, authorize } = require('../middleware/auth');
const emailService = require('../services/emailService');

// Admin Dashboard Statistics
router.get('/dashboard', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const stats = {};

    // Total books
    const totalBooksResult = await db.query('SELECT COUNT(*) FROM books');
    stats.totalBooks = parseInt(totalBooksResult.rows[0].count);

    // Available books
    const availableBooksResult = await db.query('SELECT COUNT(*) FROM books WHERE available_copies > 0');
    stats.availableBooks = parseInt(availableBooksResult.rows[0].count);

    // Total users
    const totalUsersResult = await db.query('SELECT COUNT(*) FROM users');
    stats.totalUsers = parseInt(totalUsersResult.rows[0].count);

    // Active borrowings
    const activeBorrowingsResult = await db.query(
      "SELECT COUNT(*) FROM borrowings WHERE status = 'active'"
    );
    stats.activeBorrowings = parseInt(activeBorrowingsResult.rows[0].count);

    // Overdue books
    const overdueBooksResult = await db.query(
      "SELECT COUNT(*) FROM borrowings WHERE status = 'overdue'"
    );
    stats.overdueBooks = parseInt(overdueBooksResult.rows[0].count);

    // Total fines
    const totalFinesResult = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM fines WHERE status = 'unpaid'"
    );
    stats.totalUnpaidFines = parseFloat(totalFinesResult.rows[0].total);

    // Recent activities
    const recentBorrowings = await db.query(`
      SELECT b.*, u.first_name, u.last_name, bk.title as book_title
      FROM borrowings b
      JOIN users u ON b.user_id = u.id
      JOIN books bk ON b.book_id = bk.id
      ORDER BY b.borrow_date DESC
      LIMIT 10
    `);
    stats.recentActivities = recentBorrowings.rows;

    // Popular books
    const popularBooks = await db.query(`
      SELECT bk.id, bk.title, bk.author, COUNT(b.id) as borrow_count
      FROM books bk
      LEFT JOIN borrowings b ON bk.id = b.book_id
      GROUP BY bk.id, bk.title, bk.author
      ORDER BY borrow_count DESC
      LIMIT 10
    `);
    stats.popularBooks = popularBooks.rows;

    // Category distribution
    const categoryStats = await db.query(`
      SELECT category, COUNT(*) as count
      FROM books
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
    `);
    stats.categoryDistribution = categoryStats.rows;

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard statistics'
    });
  }
});

// Get all users (Admin only)
router.get('/users', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, email, first_name, last_name, role, student_id, department, is_verified, created_at
      FROM users
      WHERE 1=1
    `;
    const countQuery = 'SELECT COUNT(*) FROM users WHERE 1=1';
    const params = [];
    
    if (search) {
      query += ` AND (email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1 OR student_id ILIKE $1)`;
      params.push(`%${search}%`);
    }

    if (role) {
      query += params.length === 0 ? ' AND role = $1' : ` AND role = $${params.length + 1}`;
      params.push(role);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    const countResult = await db.query(countQuery);

    res.json({
      success: true,
      users: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching users'
    });
  }
});

// Update user role (Admin only)
router.put('/users/:id/role', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const result = await db.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, first_name, last_name, role',
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating user role'
    });
  }
});

// Send overdue reminders
router.post('/send-overdue-reminders', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    // Get all overdue borrowings
    const overdueResult = await db.query(`
      SELECT b.*, u.email, u.first_name, bk.title
      FROM borrowings b
      JOIN users u ON b.user_id = u.id
      JOIN books bk ON b.book_id = bk.id
      WHERE b.status = 'active' AND b.due_date < CURRENT_TIMESTAMP
    `);

    // Update status to overdue and send emails
    const updatePromises = overdueResult.rows.map(async (borrowing) => {
      const daysOverdue = Math.ceil((new Date() - new Date(borrowing.due_date)) / (1000 * 60 * 60 * 24));
      const fineAmount = daysOverdue * 0.50;

      await db.query(
        "UPDATE borrowings SET status = 'overdue', fine_amount = $1 WHERE id = $2",
        [fineAmount, borrowing.id]
      );

      await emailService.sendOverdueReminder(
        borrowing.email,
        borrowing.title,
        daysOverdue,
        fineAmount
      );
    });

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: `Sent reminders for ${overdueResult.rows.length} overdue books`
    });
  } catch (error) {
    console.error('Send reminders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error sending reminders'
    });
  }
});

// Manage fines
router.get('/fines', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { status = 'unpaid' } = req.query;

    const result = await db.query(`
      SELECT f.*, u.email, u.first_name, u.last_name, u.student_id,
             b.id as book_id, bk.title as book_title
      FROM fines f
      JOIN users u ON f.user_id = u.id
      JOIN borrowings b ON f.borrowing_id = b.id
      JOIN books bk ON b.book_id = bk.id
      WHERE f.status = $1
      ORDER BY f.created_at DESC
    `, [status]);

    res.json({
      success: true,
      fines: result.rows
    });
  } catch (error) {
    console.error('Get fines error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching fines'
    });
  }
});

// Mark fine as paid
router.put('/fines/:id/pay', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `UPDATE fines 
       SET status = 'paid', paid_date = CURRENT_TIMESTAMP 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Fine record not found'
      });
    }

    // Update the borrowing record too
    await db.query(
      `UPDATE borrowings 
       SET fine_paid = true 
       WHERE id = $1`,
      [result.rows[0].borrowing_id]
    );

    res.json({
      success: true,
      message: 'Fine marked as paid',
      fine: result.rows[0]
    });
  } catch (error) {
    console.error('Pay fine error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing fine payment'
    });
  }
});

module.exports = router;