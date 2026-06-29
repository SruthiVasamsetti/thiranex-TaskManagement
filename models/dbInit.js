const mysql = require('mysql2/promise');
require('dotenv').config();

async function initDB() {
  let connection;
  try {
    const host = process.env.DB_HOST || 'localhost';
    const user = process.env.DB_USER || 'root';
    const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '';
    const port = parseInt(process.env.DB_PORT || '3306', 10);
    const dbName = process.env.DB_NAME || 'task_db';

    console.log(`Connecting to MySQL server at ${host}:${port} to initialize database...`);
    
    // Create initial connection without a selected database
    connection = await mysql.createConnection({
      host,
      user,
      password,
      port
    });

    // Create database if not exists
    console.log(`Ensuring database "${dbName}" exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.end(); // close temporary connection

    // Re-establish connection focusing on the new database to initialize structures
    const pool = require('../config/db');

    console.log('Ensuring "users" table exists...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB;
    `);

    console.log('Ensuring "tasks" table exists with foreign key relations...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('Pending', 'Completed') DEFAULT 'Pending',
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    console.log('Database initialization initialized successfully.');
  } catch (error) {
    console.error('Database initialization failed:', error);
    if (connection) {
      try {
        await connection.end();
      } catch (err) {
        // ignore double-close issues
      }
    }
    throw error;
  }
}

module.exports = initDB;
