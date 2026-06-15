import request from 'supertest';
import bcrypt from 'bcryptjs';
import { getTestApp, authHeader } from './helpers/testApp';
import { User } from '../src/models';

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await User.destroy({ where: { email: 'login@test.com' } });
    await User.create({
      username: 'loginuser',
      email: 'login@test.com',
      password_hash: await bcrypt.hash('secret123', 10),
      role: 'USER',
    });
  });

  it('should return JWT token on valid login', async () => {
    const res = await request(getTestApp())
      .post('/api/v1/auth/login')
      .send({ email: 'login@test.com', password: 'secret123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('login@test.com');
  });

  it('should return 401 for invalid password', async () => {
    const res = await request(getTestApp())
      .post('/api/v1/auth/login')
      .send({ email: 'login@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('should return 400 for invalid email format', async () => {
    const res = await request(getTestApp())
      .post('/api/v1/auth/login')
      .send({ email: 'not-an-email', password: 'secret123' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/register', () => {
  it('should register a new user and return token', async () => {
    const res = await request(getTestApp())
      .post('/api/v1/auth/register')
      .send({
        username: 'newuser',
        email: 'newuser@test.com',
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.username).toBe('newuser');
  });
});

describe('GET /api/v1/auth/me', () => {
  it('should return current user profile with valid token', async () => {
    const res = await request(getTestApp())
      .get('/api/v1/auth/me')
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe('testuser');
  });

  it('should return 401 without token', async () => {
    const res = await request(getTestApp()).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
  });
});
