const db = require('../db');

async function createTable() {
  try {
    console.log("Creating notifications_log table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notifications_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        recipient VARCHAR(255) NOT NULL,
        notification_type VARCHAR(50) NOT NULL,
        channel VARCHAR(50) DEFAULT 'email',
        subject VARCHAR(255),
        content TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        error_message TEXT,
        sent_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Table created successfully!");
  } catch (err) {
    console.error("Error creating table:", err.message);
  } finally {
    process.exit();
  }
}

createTable();
