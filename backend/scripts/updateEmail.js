const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateEmail() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'patient_tracking_system',
    port: process.env.DB_PORT || 3306,
  });

  try {
    const [result] = await connection.execute(
      'UPDATE `user` SET `email` = ? WHERE `username` = ?',
      ['mom201317@gmail.com', 'ZeMon']
    );
    
    if (result.affectedRows > 0) {
      console.log('✅ Updated email successfully for ZeMon to mom201317@gmail.com');
    } else {
      console.log('⚠️ Could not find user ZeMon in the database.');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

updateEmail();
