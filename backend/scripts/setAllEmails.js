const mysql = require('mysql2/promise');
require('dotenv').config();

async function setEmails() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'patient_tracking_system',
    port: process.env.DB_PORT || 3306,
  });

  try {
    const testEmail = 'mom201317@gmail.com';
    
    // อัปเดตผู้ป่วยทุกคน
    const [patientResult] = await connection.execute(
      'UPDATE patient SET email = ?',
      [testEmail]
    );

    console.log(`✅ อัปเดตอีเมลผู้ป่วยจำนวน ${patientResult.affectedRows} คน`);
    console.log('พร้อมสำหรับการทดสอบผ่าน Web UI แล้ว!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

setEmails();
