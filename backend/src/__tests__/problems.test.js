const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const problemRoutes = require('../routes/problemRoutes');
const Problem = require('../models/Problem');
const User = require('../models/User');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/problems', problemRoutes);

describe('Problem Routes', () => {
  let authToken;
  let userId;

  beforeEach(async () => {
    await Problem.deleteMany({});
    await User.deleteMany({});

    // Create a test user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    userId = user._id;

    // Generate token
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret-key');
  });

  describe('GET /api/problems', () => {
    it('should return all problems', async () => {
      // Create test problems
      await Problem.create([
        {
          title: 'Two Sum',
          slug: 'two-sum',
          description: 'Find two numbers that add up to target',
          difficulty: 'easy',
          category: 'Array',
          createdBy: userId,
        },
        {
          title: 'Longest Substring',
          slug: 'longest-substring',
          description: 'Find longest substring without repeating characters',
          difficulty: 'medium',
          category: 'String',
          createdBy: userId,
        },
      ]);

      const response = await request(app).get('/api/problems');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter problems by difficulty', async () => {
      await Problem.create([
        {
          title: 'Easy Problem',
          slug: 'easy-problem',
          description: 'An easy problem',
          difficulty: 'easy',
          category: 'Array',
          createdBy: userId,
        },
        {
          title: 'Hard Problem',
          slug: 'hard-problem',
          description: 'A hard problem',
          difficulty: 'hard',
          category: 'Array',
          createdBy: userId,
        },
      ]);

      const response = await request(app)
        .get('/api/problems')
        .query({ difficulty: 'easy' });

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].difficulty).toBe('easy');
    });

    it('should search problems by title', async () => {
      await Problem.create({
        title: 'Binary Search Tree',
        slug: 'binary-search-tree',
        description: 'Implement BST operations',
        difficulty: 'medium',
        category: 'Tree',
        createdBy: userId,
      });

      const response = await request(app)
        .get('/api/problems')
        .query({ search: 'Binary' });

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0].title).toContain('Binary');
    });
  });

  describe('GET /api/problems/:slug', () => {
    it('should return a problem by slug', async () => {
      const problem = await Problem.create({
        title: 'Two Sum',
        slug: 'two-sum',
        description: 'Find two numbers that add up to target',
        difficulty: 'easy',
        category: 'Array',
        createdBy: userId,
      });

      const response = await request(app).get('/api/problems/two-sum');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Two Sum');
    });

    it('should return 404 for non-existent problem', async () => {
      const response = await request(app).get('/api/problems/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/problems/:id/favorite', () => {
    it('should favorite a problem', async () => {
      const problem = await Problem.create({
        title: 'Two Sum',
        slug: 'two-sum',
        description: 'Find two numbers',
        difficulty: 'easy',
        category: 'Array',
        createdBy: userId,
      });

      const response = await request(app)
        .post(`/api/problems/${problem._id}/favorite`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.isFavorite).toBe(true);

      const updatedUser = await User.findById(userId);
      expect(updatedUser.favorites).toContainEqual(problem._id);
    });

    it('should not favorite a problem without authentication', async () => {
      const problem = await Problem.create({
        title: 'Two Sum',
        slug: 'two-sum',
        description: 'Find two numbers',
        difficulty: 'easy',
        category: 'Array',
        createdBy: userId,
      });

      const response = await request(app).post(`/api/problems/${problem._id}/favorite`);

      expect(response.status).toBe(401);
    });
  });
});
