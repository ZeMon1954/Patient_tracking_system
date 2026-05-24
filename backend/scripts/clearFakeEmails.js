const mysql = require('mysql2/promise');
require('dotenv').config();

async function clearFakeEmails() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'patient_tracking_system',
    port: process.env.DB_PORT || 3306,
  });

  try {
    // ลบอีเมลที่มีคำว่า @test.com หรืออีเมลปลอมออก (เซ็ตเป็น NULL)
    const [result] = await connection.execute(
      "UPDATE user SET email = NULL WHERE email LIKE '%@test.com%'"
    );

    console.log(`✅ เคลียร์อีเมลปลอมออกไปแล้ว ${result.affectedRows} บัญชี`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

clearFakeEmails();
