require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../db');

async function run() {
  try {
    console.log('🔄 Starting migration for urgency_level column in referral table...');

    // 1. Temporarily modify the ENUM to contain both old and new values to prevent truncation during mapping
    await db.query(`
      ALTER TABLE referral 
      MODIFY COLUMN urgency_level ENUM('normal', 'urgent', 'low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'low'
    `);
    console.log('✅ Modified ENUM to support both old and new levels.');

    // 2. Map old values to new values
    const [updateNormal] = await db.query(`
      UPDATE referral SET urgency_level = 'low' WHERE urgency_level = 'normal'
    `);
    console.log(`✅ Mapped 'normal' to 'low' (${updateNormal.affectedRows} rows updated).`);

    const [updateUrgent] = await db.query(`
      UPDATE referral SET urgency_level = 'critical' WHERE urgency_level = 'urgent'
    `);
    console.log(`✅ Mapped 'urgent' to 'critical' (${updateUrgent.affectedRows} rows updated).`);

    // 3. Keep only the 4 standard levels: 'low', 'medium', 'high', 'critical'
    await db.query(`
      ALTER TABLE referral 
      MODIFY COLUMN urgency_level ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'low'
    `);
    console.log("✅ Finalized ENUM to exactly ('low', 'medium', 'high', 'critical').");
    console.log('🚀 Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    process.exit(0);
  }
}

run();
