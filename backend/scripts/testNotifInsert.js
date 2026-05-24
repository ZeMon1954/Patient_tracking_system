const db = require('../db');
require('dotenv').config();

async function testInsert() {
  try {
    const [result] = await db.query(
      'INSERT INTO notification_system (user_id, title, message, is_read) VALUES (?,?,?,0)',
      [1, 'ทดสอบ', 'ข้อความทดสอบ']
    );
    console.log('✅ Insert OK! ID:', result.insertId);
    
    const [rows] = await db.query('SELECT * FROM notification_system WHERE user_id = 1');
    console.log('Records:', rows);
  } catch (e) {
    console.error('❌ Error:', e.message);
  }
  process.exit(0);
}
testInsert();
