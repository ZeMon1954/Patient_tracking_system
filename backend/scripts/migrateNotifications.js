const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'patient_tracking_system',
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('Creating notifications_log table...');

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS notifications_log (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        recipient    VARCHAR(255)  NOT NULL COMMENT 'อีเมลผู้รับ',
        notification_type VARCHAR(50) NOT NULL COMMENT 'NEW_APPOINTMENT | UPCOMING_REMINDER | MISSED_APPOINTMENT | NEW_REFERRAL',
        channel      VARCHAR(50)   NOT NULL DEFAULT 'email' COMMENT 'email | push',
        subject      VARCHAR(255)  NOT NULL,
        content      TEXT          NOT NULL,
        status       ENUM('pending','sent','failed') NOT NULL DEFAULT 'pending',
        sent_at      DATETIME      DEFAULT NULL,
        error_message TEXT         DEFAULT NULL,
        created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    console.log('✅ notifications_log table created successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await connection.end();
  }
}

migrate();
