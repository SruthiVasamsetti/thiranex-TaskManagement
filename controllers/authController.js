const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

// User Registration
exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Simple validation
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    if (username.trim().length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const [existingUsers] = await pool.query('SELECT id FROM users WHERE username = ?', [username.trim()]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user
    const [result] = await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username.trim(), hashedPassword]
    );

    // Fetch the new user's ID
    const userId = result.insertId;

    // Generate JWT token directly so they are immediately logged in
    const token = jwt.sign(
      { id: userId, username: username.trim() },
      process.env.JWT_SECRET || 'a_default_backup_jwt_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userId,
        username: username.trim()
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

// User Login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check parameters
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username.trim()]);
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'a_default_backup_jwt_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};
