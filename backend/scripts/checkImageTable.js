const db = require('../db');

async function checkImageTable() {
  try {
    const [tables] = await db.query('SHOW TABLES');
    console.log("Tables in database:", tables.map(t => Object.values(t)[0]));
    
    try {
      const [desc] = await db.query('DESCRIBE image');
      console.log("Image table schema:", desc);
    } catch (e) {
      console.error("Image table does not exist or error:", e.message);
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

checkImageTable();
