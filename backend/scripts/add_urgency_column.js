require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../db');

async function run() {
  try {
    const [cols] = await db.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'referral' AND COLUMN_NAME = 'urgency_level'
    `);
    if (cols.length > 0) {
      console.log('Column urgency_level already exists, skipping.');
      return;
    }
    await db.query(`
      ALTER TABLE referral 
      ADD COLUMN urgency_level ENUM('normal','urgent') NOT NULL DEFAULT 'normal'
    `);
    console.log('✅ Added urgency_level column to referral table');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

run();
