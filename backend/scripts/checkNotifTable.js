const db = require('../db');
require('dotenv').config();

async function checkTable() {
  try {
    const [cols] = await db.query('SHOW COLUMNS FROM notification_system');
    console.log('notification_system columns:');
    cols.forEach(c => console.log(' -', c.Field, c.Type, c.Null, c.Default));
  } catch (e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
}
checkTable();
