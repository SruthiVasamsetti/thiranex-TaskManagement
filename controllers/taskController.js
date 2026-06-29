const pool = require('../config/db');

// Create a new task
exports.createTask = async (req, res) => {
  try {
    const { title, description, due_date } = req.body;
    const userId = req.user.id;

    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Task title is required' });
    }

    // Insert task
    const [result] = await pool.query(
      'INSERT INTO tasks (user_id, title, description, due_date) VALUES (?, ?, ?, ?)',
      [userId, title.trim(), description ? description.trim() : null, due_date || null]
    );

    // Fetch the newly created task to return it
    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);

    return res.status(201).json({
      message: 'Task created successfully',
      task: tasks[0]
    });
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ message: 'Server error while creating task' });
  }
};

// Retrieve all tasks for the logged-in user
exports.getAllTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch tasks ordered by status (Pending first) and then due date
    const [tasks] = await pool.query(
      'SELECT id, title, description, status, due_date, created_at FROM tasks WHERE user_id = ? ORDER BY status DESC, due_date ASC, created_at DESC',
      [userId]
    );

    return res.status(200).json({ tasks });
  } catch (error) {
    console.error('Fetch tasks error:', error);
    return res.status(500).json({ message: 'Server error while fetching tasks' });
  }
};

// Update an existing task
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, due_date } = req.body;
    const userId = req.user.id;

    // Verify task exists and belongs to the user
    const [tasks] = await pool.query('SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    const currentTask = tasks[0];

    // Maintain current values if not provided
    const updatedTitle = title !== undefined ? title.trim() : currentTask.title;
    const updatedDescription = description !== undefined ? description.trim() : currentTask.description;
    const updatedStatus = status !== undefined ? status : currentTask.status;
    const updatedDueDate = due_date !== undefined ? (due_date || null) : currentTask.due_date;

    if (!updatedTitle || updatedTitle === '') {
      return res.status(400).json({ message: 'Task title cannot be empty' });
    }

    if (updatedStatus && !['Pending', 'Completed'].includes(updatedStatus)) {
      return res.status(400).json({ message: 'Invalid task status. Must be "Pending" or "Completed"' });
    }

    // Update tasks table
    await pool.query(
      'UPDATE tasks SET title = ?, description = ?, status = ?, due_date = ? WHERE id = ? AND user_id = ?',
      [updatedTitle, updatedDescription, updatedStatus, updatedDueDate, id, userId]
    );

    // Retrieve modified task
    const [updatedTasks] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);

    return res.status(200).json({
      message: 'Task updated successfully',
      task: updatedTasks[0]
    });
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({ message: 'Server error while updating task' });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check task existence and ownership before deleting
    const [tasks] = await pool.query('SELECT id FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
    if (tasks.length === 0) {
      return res.status(404).json({ message: 'Task not found or unauthorized' });
    }

    // Perform Delete query
    await pool.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);

    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({ message: 'Server error while deleting task' });
  }
};
