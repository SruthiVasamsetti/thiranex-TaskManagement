const express = require('express');
const cors = require('cors');
require('dotenv').config();

const initDB = require('./models/dbInit');
const authMiddleware = require('./middleware/authMiddleware');
const authController = require('./controllers/authController');
const taskController = require('./controllers/taskController');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all requests (ideal for client-server integration)
app.use(cors());

// Parse incoming JSON requests
app.use(express.json());

// Database connection initialization
initDB()
  .then(() => {
    console.log('Database verification and tables checked.');
  })
  .catch((err) => {
    console.error('Fatal initialization error. Stopping server...');
    process.exit(1);
  });

// --- API Routing Configuration ---

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Authentication endpoints
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);

// Task management endpoints (Strictly protected by authentication middleware)
app.get('/api/tasks', authMiddleware, taskController.getAllTasks);
app.post('/api/tasks', authMiddleware, taskController.createTask);
app.put('/api/tasks/:id', authMiddleware, taskController.updateTask);
app.delete('/api/tasks/:id', authMiddleware, taskController.deleteTask);

// Error handling middleware for unexpected server issues
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start listening
app.listen(PORT, () => {
  console.log(`Backend Server is listening on http://localhost:${PORT}`);
});
