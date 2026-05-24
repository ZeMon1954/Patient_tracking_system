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
    const tablesToCheck = ['appointments', 'notification_system'];
    for (const tableName of tablesToCheck) {
      try {
        const [columns] = await connection.execute(`DESCRIBE \`${tableName}\``);
        console.log(`\nColumns in ${tableName}:`);
        console.table(columns.map(c => ({ Field: c.Field, Type: c.Type })));
      } catch (e) {
        console.log(`Table ${tableName} does not exist or error: ${e.message}`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

check();
