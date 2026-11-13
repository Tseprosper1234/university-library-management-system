const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, authorize } = require('../middleware/auth');

// Get all books with pagination and search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      category = '',
      author = '',
      available = ''
    } = req.query;

    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM books WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) FROM books WHERE 1=1';
    const params = [];
    const countParams = [];
    let paramCount = 1;

    if (search) {
      query += ` AND (title ILIKE $${paramCount} OR author ILIKE $${paramCount} OR isbn ILIKE $${paramCount})`;
      countQuery += ` AND (title ILIKE $${paramCount} OR author ILIKE $${paramCount} OR isbn ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
      paramCount++;
    }

    if (category) {
      query += ` AND category = $${paramCount}`;
      countQuery += ` AND category = $${paramCount}`;
      params.push(category);
      countParams.push(category);
      paramCount++;
    }

    if (author) {
      query += ` AND author ILIKE $${paramCount}`;
      countQuery += ` AND author ILIKE $${paramCount}`;
      params.push(`%${author}%`);
      countParams.push(`%${author}%`);
      paramCount++;
    }

    if (available === 'true') {
      query += ` AND available_copies > 0`;
      countQuery += ` AND available_copies > 0`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    const booksResult = await db.query(query, params);
    const countResult = await db.query(countQuery, countParams);

    const totalBooks = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalBooks / limit);

    res.json({
      success: true,
      books: booksResult.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalBooks,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching books'
    });
  }
});

// Get single book
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query('SELECT * FROM books WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      book: result.rows[0]
    });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching book'
    });
  }
});

// Add new book (Admin only)
router.post('/', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const {
      isbn,
      title,
      author,
      publisher,
      publicationYear,
      edition,
      category,
      totalCopies,
      shelfLocation,
      description,
      coverImageUrl
    } = req.body;

    // Check if book already exists
    const existingBook = await db.query(
      'SELECT * FROM books WHERE isbn = $1',
      [isbn]
    );

    if (existingBook.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Book with this ISBN already exists'
      });
    }

    const result = await db.query(
      `INSERT INTO books (isbn, title, author, publisher, publication_year, edition, category, total_copies, available_copies, shelf_location, description, cover_image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [isbn, title, author, publisher, publicationYear, edition, category, totalCopies || 1, totalCopies || 1, shelfLocation, description, coverImageUrl]
    );

    res.status(201).json({
      success: true,
      message: 'Book added successfully',
      book: result.rows[0]
    });
  } catch (error) {
    console.error('Add book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding book'
    });
  }
});

// Update book (Admin only)
router.put('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    
    // Build dynamic update query
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateFields)) {
      if (key !== 'id' && key !== 'created_at') {
        const columnName = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        setClauses.push(`${columnName} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    values.push(id);
    const query = `UPDATE books SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
    
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      message: 'Book updated successfully',
      book: result.rows[0]
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating book'
    });
  }
});

// Delete book (Admin only)
router.delete('/:id', authenticateToken, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM books WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting book'
    });
  }
});

// Get all categories
router.get('/categories/all', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT DISTINCT category FROM books WHERE category IS NOT NULL ORDER BY category');
    
    res.json({
      success: true,
      categories: result.rows.map(row => row.category)
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching categories'
    });
  }
});

module.exports = router;