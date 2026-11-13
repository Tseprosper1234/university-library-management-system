const request = require('supertest');
const app = require('../server');
const db = require('../database/db');

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    // Clear test data
    await db.query('DELETE FROM users WHERE email LIKE $1', ['%test%']);
  });

  afterAll(async () => {
    await db.query('DELETE FROM users WHERE email LIKE $1', ['%test%']);
    await db.pool.end();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User',
          role: 'student',
          studentId: 'STU001'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should not register duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          firstName: 'Test2',
          lastName: 'User2'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      // First verify the email
      const verifyRes = await request(app)
        .get('/api/auth/verify-email/test-token');
      
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
    });

    it('should not login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });
});