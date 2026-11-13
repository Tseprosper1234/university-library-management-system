const db = require('./db');
const fs = require('fs');
const path = require('path');

const migrate = async () => {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Read and execute schema
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema.sql'), 
      'utf8'
    );
    
    await client.query(schemaSQL);
    
    // Create admin user if not exists
    const bcrypt = require('bcryptjs');
    const adminExists = await client.query(
      "SELECT * FROM users WHERE email = $1",
      ['admin@university.edu']
    );
    
    if (adminExists.rows.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin123!', salt);
      
      await client.query(
        `INSERT INTO users (email, password, first_name, last_name, role, is_verified)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['admin@university.edu', hashedPassword, 'Admin', 'User', 'admin', true]
      );
      
      console.log('Default admin user created');
    }
    
    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await db.pool.end();
  }
};

migrate().catch(console.error);