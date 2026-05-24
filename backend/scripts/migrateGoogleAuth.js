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
    console.log('Migrating database schema...');

    // 1. Check if 'email' column already exists in 'user'
    const [columns] = await connection.execute('DESCRIBE `user`');
    const hasEmail = columns.some(col => col.Field === 'email');

    if (!hasEmail) {
      console.log("Adding 'email' column to 'user' table...");
      await connection.execute('ALTER TABLE `user` ADD COLUMN `email` VARCHAR(255) UNIQUE DEFAULT NULL AFTER `username`');
      console.log("Column 'email' added successfully.");
    } else {
      console.log("Column 'email' already exists on 'user' table.");
    }

    // 2. Update existing users with test emails
    console.log('Seeding emails for test accounts...');
    const testEmails = {
      'manager_test': 'manager@test.com',
      'hos_test': 'hos@test.com',
      'pcu_test': 'pcu@test.com',
      'ZeMon': 'zemon@test.com',
      'admid_test': 'admin@test.com',
      'admin_test': 'admin_system@test.com'
    };

    for (const [username, email] of Object.entries(testEmails)) {
      // Check if user exists
      const [rows] = await connection.execute('SELECT id FROM `user` WHERE `username` = ?', [username]);
      if (rows.length > 0) {
        await connection.execute('UPDATE `user` SET `email` = ? WHERE `username` = ?', [email, username]);
        console.log(`Updated email for ${username} to ${email}`);
      }
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await connection.end();
  }
}

migrate();
