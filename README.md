# TaskUp - Full-Stack Task Management System

TaskUp is a modern, responsive, and secure full-stack Task Management Application developed as a high-quality internship submission. 

Featuring a **glassmorphic dark UI layout**, it supports secure user authentication, token persistence, statistics counters, and full database CRUD workflows tracking status changes and due dates.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Vanilla HTML5, CSS3 Custom Styling (No Tailwind, fully custom variables & custom responsive states), JavaScript (ES6, Fetch API integrations, local state routers).
- **Backend**: Node.js + Express.js REST API with route interceptors.
- **Database**: XAMPP MySQL database with automatic table schema initializes.
- **Authentication**: JWT Authorization (Signed tokens with expiration configuration) + BcryptJS Password Hashing.

```
task-manager/
├── frontend/
│   ├── index.html         # User landing page with Login/Register toggle view
│   ├── dashboard.html     # User task dashboard containing stats, filters, task list and form modal
│   ├── style.css          # Core CSS variables, typography, animations and responsive screen layout
│   └── app.js             # Client-side routing, API dispatch and DOM renderers
└── backend/
    ├── config/db.js       # MySQL async connection pool config
    ├── controllers/
    │   ├── authController.js # Hashed registration and token-issued login logic
    │   └── taskController.js # Authenticated tasks CRUD controllers
    ├── middleware/
    │   └── authMiddleware.js # Bearer verification middleware interceptor
    ├── models/
    │   └── dbInit.js      # Dynamic DB & table structure schema initializations
    ├── .env               # Port configs, database credentials and token security keys
    ├── package.json       # App metadata and dependency bindings
    └── server.js          # REST Server entry point, CORS handlers and route registration
```

---

## 🚀 Pre-requisites & Database Setup

1. **XAMPP Server**: Make sure XAMPP is installed on your machine.
2. **Start MySQL Database**:
   - Open **XAMPP Control Panel**.
   - Press **Start** next to the **MySQL** service (default port is `3306`).
   - (Optional) Start **Apache** if you'd like to browse locally from localhost; however, you can run the files directly in your web browser.
3. Keep default settings: the application connects using username `'root'` and a blank password `''`. It will automatically check and create the database `task_db` and tables (`users`, `tasks`) on server load!

---

## 💻 Running the Application

### 1. Start the Backend API Server
Open your terminal inside the `backend` directory (e.g. `task-manager/backend/`) and run the setup scripts:

```bash
# Navigate to the backend folder
cd task-manager/backend

# Install dependencies (express, mysql2, cors, bcryptjs, jsonwebtoken, dotenv)
npm install

# Start the application server
npm start
```

You should see console outputs confirming connection status:
```text
Backend Server is listening on http://localhost:5000
Connecting to MySQL server at localhost:3306 to initialize database...
Ensuring database "task_db" exists...
Ensuring "users" table exists...
Ensuring "tasks" table exists with foreign key relations...
Database initialization initialized successfully.
Database verification and tables checked.
```

### 2. Launch the Frontend UI
Because frontend code uses absolute API calls to `http://localhost:5000`, you can run the UI directly by double-clicking the `index.html` file inside `task-manager/frontend/` or opening it through any local Live Server (like VS Code Live Server).

---

## 🔒 Security Practices Configured

- **Authentication Guarding**: The backend blocks access to task operations unless requests provide an `Authorization: Bearer <JWT_TOKEN>` header.
- **SQL Injection Prevention**: Prepared query structures in the controller pool executing parameters `?` securely escape SQL injections.
- **Data Protection**: User passwords are saved as security-hashed arrays hashed with a salt factor of 10 from `bcryptjs`, preventing plaintext exposures.
- **XSS Protections**: Data strings injected onto the DOM inside the dashboard are processed with a custom `escapeHTML` utility, neutralizing malicious script tags.
