const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'c:/Users/mom20/OneDrive/Desktop/ฝึกงาน/Patient_tracking_system/backend/.env' });

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'patient_tracking_system',
    port: process.env.DB_PORT || 3306,
  });

  try {
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('Tables in DB:');
    tables.forEach(row => console.log(Object.values(row)[0]));
    
    // If appointment exists, describe it
    const hasAppt = tables.some(row => Object.values(row)[0] === 'appointment');
    if (hasAppt) {
      const [columns] = await connection.execute('DESCRIBE `appointment`');
      console.log('\nColumns in appointment:');
      console.table(columns.map(c => ({ Field: c.Field, Type: c.Type })));
    } else {
      console.log('\nNo appointment table found.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

check();
