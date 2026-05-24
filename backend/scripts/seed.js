const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config(); // Load .env from current directory (backend)

async function seed() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'patient_tracking_system',
      port: process.env.DB_PORT || 3306,
    });

    console.log('Connected. Starting seed process...');

    // 1. Seed Service Units
    const serviceUnits = [
      { unit_code: '10001', name: 'โรงพยาบาลศูนย์ชลบุรี', address: 'อ.เมือง จ.ชลบุรี' },
      { unit_code: '20001', name: 'รพ.สต. บ้านด่าน', address: 'อ.เมือง จ.ชลบุรี' }
    ];

    let hospitalId = 1;
    let pcuId = 2;

    for (const unit of serviceUnits) {
      const [existing] = await connection.execute('SELECT id FROM service_unit WHERE unit_code = ?', [unit.unit_code]);
      if (existing.length === 0) {
        const [result] = await connection.execute(
          'INSERT INTO service_unit (unit_code, name, address) VALUES (?, ?, ?)',
          [unit.unit_code, unit.name, unit.address]
        );
        console.log(`Inserted service_unit: ${unit.name}`);
        if (unit.unit_code === '10001') hospitalId = result.insertId;
        if (unit.unit_code === '20001') pcuId = result.insertId;
      } else {
        console.log(`Service unit already exists: ${unit.name}`);
        if (unit.unit_code === '10001') hospitalId = existing[0].id;
        if (unit.unit_code === '20001') pcuId = existing[0].id;
      }
    }

    // 2. Seed Users
    const passwordHash = await bcrypt.hash('1234', 10);
    const users = [
      { username: 'admin_test', email: 'admin_system@test.com', first_name: 'Admin', last_name: 'System', role: 'admin', service_unit_id: hospitalId },
      { username: 'manager_test', email: 'manager@test.com', first_name: 'Manager', last_name: 'Director', role: 'manager', service_unit_id: hospitalId },
      { username: 'hos_test', email: 'hos@test.com', first_name: 'Hospital', last_name: 'Staff', role: 'hospital_staff', service_unit_id: hospitalId },
      { username: 'pcu_test', email: 'pcu@test.com', first_name: 'PCU', last_name: 'Staff', role: 'pcu_staff', service_unit_id: pcuId }
    ];

    for (const user of users) {
      const [existing] = await connection.execute('SELECT id FROM user WHERE username = ?', [user.username]);
      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO user (username, email, password_hash, first_name, last_name, role, service_unit_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [user.username, user.email, passwordHash, user.first_name, user.last_name, user.role, user.service_unit_id]
        );
        console.log(`Inserted user: ${user.username} (Role: ${user.role})`);
      } else {
        // Update role, password, and email if it already exists, just to be sure it's correct
        await connection.execute(
          'UPDATE user SET password_hash = ?, role = ?, email = ? WHERE username = ?',
          [passwordHash, user.role, user.email, user.username]
        );
        console.log(`Updated existing user: ${user.username}`);
      }
    }

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    if (connection) await connection.end();
  }
}

seed();
