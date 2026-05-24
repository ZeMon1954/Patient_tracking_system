const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixNotifTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'patient_tracking_system',
    port: process.env.DB_PORT || 3306,
  });

  try {
    // เช็คว่า id มี AUTO_INCREMENT หรือยัง
    const [cols] = await connection.execute("SHOW CREATE TABLE notification_system");
    const createStmt = cols[0]['Create Table'];
    console.log(createStmt);

    // แก้ไขตาราง: เพิ่ม AUTO_INCREMENT ให้ id และทำให้ message เป็น NULL ได้
    await connection.execute(`
      ALTER TABLE notification_system 
        MODIFY id INT NOT NULL AUTO_INCREMENT,
        MODIFY message TEXT NULL DEFAULT NULL
    `);
    console.log('✅ Fixed notification_system table successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixNotifTable();
