const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
  let localConn, aivenConn;
  try {
    console.log('🔌 Connecting to Local MySQL (localhost)...');
    localConn = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '0984525176mon',
      database: 'patient_tracking_system',
      port: 3306
    });
    console.log('✅ Connected to Local MySQL.');

    console.log('🔌 Connecting to Aiven MySQL Cloud...');
    aivenConn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT) || 3306,
      ssl: {
        rejectUnauthorized: false
      }
    });
    console.log('✅ Connected to Aiven MySQL Cloud.');

    // Get all tables from local database
    const [tables] = await localConn.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log(`📦 Found ${tableNames.length} tables locally:`, tableNames);

    // Disable foreign key checks on Aiven during migration to avoid dependency errors
    await aivenConn.query('SET FOREIGN_KEY_CHECKS = 0');

    for (const tableName of tableNames) {
      console.log(`\n🔄 Migrating table: \`${tableName}\`...`);

      // 1. Drop existing table on Aiven if exists
      await aivenConn.query(`DROP TABLE IF EXISTS \`${tableName}\``);

      // 2. Get CREATE TABLE query from Local MySQL
      const [createRes] = await localConn.query(`SHOW CREATE TABLE \`${tableName}\``);
      const createSQL = createRes[0]['Create Table'];
      
      // Execute the create query on Aiven
      await aivenConn.query(createSQL);
      console.log(`  🔹 Created table structure on Aiven.`);

      // 3. Copy rows
      const [rows] = await localConn.query(`SELECT * FROM \`${tableName}\``);
      if (rows.length > 0) {
        const keys = Object.keys(rows[0]);
        const columns = keys.map(k => `\`${k}\``).join(', ');
        const placeholders = keys.map(() => '?').join(', ');
        const insertSQL = `INSERT INTO \`${tableName}\` (${columns}) VALUES (${placeholders})`;

        for (const row of rows) {
          const values = Object.values(row);
          await aivenConn.query(insertSQL, values);
        }
        console.log(`  🔹 Migrated ${rows.length} rows successfully.`);
      } else {
        console.log(`  🔹 Table is empty. No rows to migrate.`);
      }
    }

    // Re-enable foreign key checks
    await aivenConn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('\n🎉 ====================================================');
    console.log('🎉 ALL TABLES AND DATA MIGRATED SUCCESSFULLY TO AIVEN!');
    console.log('🎉 ====================================================\n');

  } catch (err) {
    console.error('\n❌ Migration failed with error:', err);
  } finally {
    if (localConn) await localConn.end();
    if (aivenConn) await aivenConn.end();
  }
}

runMigration();
