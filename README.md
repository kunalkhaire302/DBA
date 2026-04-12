# 🏦 DBA: Advanced Database Administration Platform

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge\&logo=nodedotjs\&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge\&logo=mysql\&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge\&logo=javascript\&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge\&logo=html5\&logoColor=white)

An advanced web-based Database Administration tool designed to monitor, manage, and analyze backend SQL databases. This project demonstrates core DBA capabilities including automatic audit logging via SQL triggers, slow query monitoring, and real-time database performance visualization.

---

## 🚀 Key Features

### 1. Audit Log & Database Triggers

* **Automated Tracking:** Utilizes MySQL triggers (`AFTER INSERT`, `AFTER UPDATE`, `AFTER DELETE`) automatically attached to core tables to monitor modifications.
* **State Change Logging:** A centralized `audit_log` table accurately tracks exact state changes, mapping `old_value` to `new_value` to maintain high data integrity.
* **Admin Dashboard:** Includes a dedicated frontend Audit Log viewer allowing administrators to effortlessly review historical data changes.

### 2. Query Analyzer & Slow Query Monitor

* **Execution Profiling:** Features a custom wrapper around Node.js MySQL queries designed to intercept and log execution times.
* **REST API Endpoints:** Implements dedicated routes (`GET /query-logs` and `GET /slow-queries`) to fetch performance metrics.
* **Visual Analytics:** Integrates `query-analyzer.html` using **Chart.js** to display graphical representations of database performance.
* **Arbitrary Execution:** Allows administrators to manually execute and test arbitrary SQL statements directly from the web interface.

---

## 🛠️ Tech Stack

* **Backend:** Node.js, Express.js
* **Database:** MySQL / PLSQL
* **Frontend:** HTML5, CSS3, Vanilla JavaScript, Chart.js
* **Scripting:** Windows Batchfile (`start.bat`)

---

## 📂 Project Structure

```text
DBA/
│
├── public/                 # Static frontend assets (HTML, CSS, JS, Chart.js integrations)
├── tmp/                    # Temporary files and logs
├── BankDBA.sql             # SQL Schema, Tables, and Triggers definition
├── db.js                   # Main database configuration and connection logic
├── db.real.js              # Production/real database connection wrapper
├── migrate.js              # Database migration and setup script
├── server.js               # Express server entry point and API routes
├── test-persistence.js     # Testing utility for database persistence and query times
├── start.bat               # Windows batch script for quick server startup
├── package.json            # Node.js dependencies and project metadata
└── README.md               # Project documentation
```

---

## ⚙️ Installation & Setup

### Prerequisites

* Node.js (v14.x or higher recommended)
* MySQL Server installed and running locally or remotely

---

### Step-by-Step Guide

#### 1. Clone the repository

```bash
git clone https://github.com/kunalkhaire302/DBA.git
cd DBA
```

#### 2. Install dependencies

```bash
npm install
```

#### 3. Configure the Database

Run the SQL script:

```bash
mysql -u your_username -p < BankDBA.sql
```

Update credentials in:

* `db.js`
* `db.real.js`

---

#### 4. Run Migrations (Optional)

```bash
node migrate.js
```

---

#### 5. Start the server

Using Node:

```bash
node server.js
```

OR (Windows):

```dos
start.bat
```

---

#### 6. Access the Application

Open:

```
http://localhost:3000
```

---

## 📊 Usage Highlights

### 🔍 Monitoring Queries

* Navigate to **Query Analyzer**
* View execution time graphs via Chart.js
* Identify slow queries (performance bottlenecks)

---

### 🧾 Auditing Data

* Perform CRUD operations
* Open **Audit Log Viewer**
* View `old_value` → `new_value` changes tracked by triggers

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

### Steps:

1. Fork the project
2. Create a branch

   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit changes

   ```bash
   git commit -m "Add some AmazingFeature"
   ```
4. Push to GitHub

   ```bash
   git push origin feature/AmazingFeature
   ```
5. Open a Pull Request

---

## 📝 License

This project is open-source and available under the **MIT License**.
