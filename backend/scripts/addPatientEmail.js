const mysql = require('mysql2/promise');
require('dotenv').config();

async function addEmailToPatient() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'patient_tracking_system',
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log('Adding email column to patient table...');
    
    // ลองเช็คก่อนว่ามีคอลัมน์แล้วหรือยัง
    const [cols] = await connection.execute("SHOW COLUMNS FROM patient LIKE 'email'");
    if (cols.length === 0) {
      await connection.execute(`
        ALTER TABLE patient 
        ADD COLUMN email VARCHAR(255) DEFAULT NULL AFTER phone
      `);
      console.log('✅ Successfully added email column to patient table.');
    } else {
      console.log('ℹ️ email column already exists in patient table.');
    }
  } catch (error) {
    console.error('❌ Error adding column:', error);
  } finally {
    await connection.end();
  }
}

addEmailToPatient();
