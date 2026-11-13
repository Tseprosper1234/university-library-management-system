const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { authenticateToken, authorize } = require('../middleware/auth');
const emailService = require('../services/emailService');

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, first_name, last_name, role, student_id, 
              department, is_verified, created_at, updated_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user statistics
    const statsQuery = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM borrowings WHERE user_id = $1) as total_borrowings,
        (SELECT COUNT(*) FROM borrowings WHERE user_id = $1 AND status = 'active') as active_borrowings,
        (SELECT COUNT(*) FROM borrowings WHERE user_id = $1 AND status = 'overdue') as overdue_borrowings,
        (SELECT COALESCE(SUM(amount), 0) FROM fines WHERE user_id = $1 AND status = 'unpaid') as total_fines`,
      [req.user.id]
    );

    const userProfile = {
      ...result.rows[0],
      stats: statsQuery.rows[0]
    };

    res.json({
      success: true,
      user: userProfile
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, department, studentId } = req.body;
    const userId = req.user.id;

    const updateFields = {};
    if (firstName) updateFields.first_name = firstName;
    if (lastName) updateFields.last_name = lastName;
    if (department) updateFields.department = department;
    if (studentId) updateFields.student_id = studentId;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    // Build dynamic query
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateFields)) {
      setClauses.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }

    values.push(userId);
    
    const query = `
      UPDATE users 
      SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${paramCount} 
      RETURNING id, email, first_name, last_name, role, student_id, department, is_verified
    `;

    const result = await db.query(query, values);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get current user
    const userResult = await db.query(
      'SELECT password FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Validate new password
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await db.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, userId]
    );

    // Send notification email
    const userEmail = await db.query(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );

    await emailService.sendEmail({
      to: userEmail.rows[0].email,
      subject: 'Password Changed - University Library',
      htmlContent: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: #4CAF50; color: white; padding: 20px; text-align: center;">
            <h2>Password Changed Successfully</h2>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <p>Your password has been changed successfully.</p>
            <p>If you did not make this change, please contact the library administrator immediately.</p>
            <p style="color: #f44336; font-weight: bold;">Security Alert: If this wasn't you, your account may be compromised.</p>
          </div>
        </div>
      `,
      textContent: 'Your password has been changed. If you did not make this change, contact the library administrator immediately.'
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error changing password'
    });
  }
});

// Get user borrowing history
router.get('/borrowing-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT b.*, bk.title, bk.author, bk.isbn, bk.category
       FROM borrowings b
       JOIN books bk ON b.book_id = bk.id
       WHERE b.user_id = $1
       ORDER BY b.borrow_date DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await db.query(
      'SELECT COUNT(*) FROM borrowings WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      borrowings: result.rows,
      total: parseInt(countResult.rows[0].count),
      currentPage: parseInt(page),
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    });
  } catch (error) {
    console.error('Get borrowing history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching borrowing history'
    });
  }
});

// Get user fines
router.get('/fines', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT f.*, bk.title as book_title, b.borrow_date, b.due_date
      FROM fines f
      JOIN borrowings b ON f.borrowing_id = b.id
      JOIN books bk ON b.book_id = bk.id
      WHERE f.user_id = $1
    `;
    const params = [userId];

    if (status) {
      query += ' AND f.status = $2';
      params.push(status);
    }

    query += ' ORDER BY f.created_at DESC';

    const result = await db.query(query, params);

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

// Get user dashboard data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current active borrowings
    const activeBorrowings = await db.query(
      `SELECT b.*, bk.title, bk.author, bk.isbn, bk.cover_image_url
       FROM borrowings b
       JOIN books bk ON b.book_id = bk.id
       WHERE b.user_id = $1 AND b.status IN ('active', 'overdue')
       ORDER BY b.due_date ASC
       LIMIT 5`,
      [userId]
    );

    // Get recent returns
    const recentReturns = await db.query(
      `SELECT b.*, bk.title, bk.author
       FROM borrowings b
       JOIN books bk ON b.book_id = bk.id
       WHERE b.user_id = $1 AND b.status = 'returned'
       ORDER BY b.return_date DESC
       LIMIT 5`,
      [userId]
    );

    // Get pending reservations
    const pendingReservations = await db.query(
      `SELECT r.*, bk.title, bk.author, bk.cover_image_url
       FROM reservations r
       JOIN books bk ON r.book_id = bk.id
       WHERE r.user_id = $1 AND r.status = 'pending'
       ORDER BY r.reservation_date DESC`,
      [userId]
    );

    // Get summary statistics
    const stats = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM borrowings WHERE user_id = $1 AND status = 'active') as active_count,
        (SELECT COUNT(*) FROM borrowings WHERE user_id = $1 AND status = 'overdue') as overdue_count,
        (SELECT COALESCE(SUM(amount), 0) FROM fines WHERE user_id = $1 AND status = 'unpaid') as total_fines,
        (SELECT COUNT(*) FROM reservations WHERE user_id = $1 AND status = 'pending') as pending_reservations`,
      [userId]
    );

    res.json({
      success: true,
      dashboard: {
        activeBorrowings: activeBorrowings.rows,
        recentReturns: recentReturns.rows,
        pendingReservations: pendingReservations.rows,
        stats: stats.rows[0]
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching dashboard data'
    });
  }
});

// Delete user account
router.delete('/account', authenticateToken, async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const userId = req.user.id;

    // Check if user has any active borrowings
    const activeBorrowings = await client.query(
      `SELECT COUNT(*) FROM borrowings 
       WHERE user_id = $1 AND status IN ('active', 'overdue')`,
      [userId]
    );

    if (parseInt(activeBorrowings.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Cannot delete account with active borrowings. Please return all books first.'
      });
    }

    // Check if user has unpaid fines
    const unpaidFines = await client.query(
      `SELECT COUNT(*) FROM fines 
       WHERE user_id = $1 AND status = 'unpaid'`,
      [userId]
    );

    if (parseInt(unpaidFines.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Cannot delete account with unpaid fines. Please pay all fines first.'
      });
    }

    // Delete user's reservations
    await client.query('DELETE FROM reservations WHERE user_id = $1', [userId]);
    
    // Delete user's fines
    await client.query('DELETE FROM fines WHERE user_id = $1', [userId]);
    
    // Delete user's borrowings
    await client.query('DELETE FROM borrowings WHERE user_id = $1', [userId]);
    
    // Delete user account
    await client.query('DELETE FROM users WHERE id = $1', [userId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting account'
    });
  } finally {
    client.release();
  }
});

module.exports = router;