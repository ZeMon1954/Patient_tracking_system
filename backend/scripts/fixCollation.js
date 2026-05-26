const db = require('../db');

async function fixCollation() {
  try {
    // 1. Get collation of patient.email
    const [rows] = await db.query(`
      SELECT COLLATION_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'patient' AND COLUMN_NAME = 'email' AND TABLE_SCHEMA = DATABASE()
    `);
    
    if (rows.length > 0) {
      const collation = rows[0].COLLATION_NAME;
      console.log("Patient email collation is:", collation);
      
      // Derive charset from collation (e.g., utf8mb4_unicode_ci -> utf8mb4)
      const charset = collation.split('_')[0];
      
      console.log(`Altering notifications_log to use charset ${charset} and collation ${collation}...`);
      
      await db.query(`ALTER TABLE notifications_log CONVERT TO CHARACTER SET ${charset} COLLATE ${collation}`);
      
      console.log("Collation fixed successfully!");
    } else {
      console.log("Could not find patient.email column info.");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit();
  }
}

fixCollation();
