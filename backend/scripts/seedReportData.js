// scripts/seedReportData.js — seed ข้อมูลตัวอย่างสำหรับรายงาน
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'patient_tracking_system',
      port: process.env.DB_PORT || 3306,
    });
    console.log('✅ Connected');

    // ---- 1. Underlying Diseases ----
    const diseases = [
      { icd10_code: 'E11', name: 'เบาหวาน' },
      { icd10_code: 'I10', name: 'ความดันโลหิตสูง' },
      { icd10_code: 'J45', name: 'หอบหืด' },
      { icd10_code: 'N18', name: 'โรคไตเรื้อรัง' },
      { icd10_code: 'I25', name: 'โรคหัวใจ' },
    ];
    for (const d of diseases) {
      const [ex] = await conn.execute('SELECT id FROM underlying_disease WHERE icd10_code=?', [d.icd10_code]);
      if (ex.length === 0) {
        await conn.execute('INSERT INTO underlying_disease (icd10_code, name) VALUES (?,?)', [d.icd10_code, d.name]);
        console.log(`Inserted disease: ${d.name}`);
      }
    }
    const [diseaseRows] = await conn.execute('SELECT id, name FROM underlying_disease');

    // ---- 2. Get service units ----
    const [units] = await conn.execute('SELECT id, name FROM service_unit LIMIT 5');
    if (units.length === 0) { console.log('⚠️ No service units found'); return; }

    // ---- 3. Get users ----
    const [users] = await conn.execute('SELECT id, first_name, last_name FROM user');
    if (users.length === 0) { console.log('⚠️ No users found'); return; }

    // ---- 4. Patients ----
    const patientSamples = [
      { hn: 'HN-2567-001', cid: '1100100000001', first_name: 'สมชาย', last_name: 'ใจดี',        dob: '1966-03-15', gender: 'male',   phone: '081-234-5678' },
      { hn: 'HN-2567-002', cid: '1100100000002', first_name: 'สมหญิง', last_name: 'รักสุขภาพ',  dob: '1961-07-22', gender: 'female', phone: '089-876-5432' },
      { hn: 'HN-2567-003', cid: '1100100000003', first_name: 'วันชัย', last_name: 'ติดธุระ',    dob: '1958-11-05', gender: 'male',   phone: '081-111-2222' },
      { hn: 'HN-2567-004', cid: '1100100000004', first_name: 'มาลี',   last_name: 'สดใส',       dob: '1970-05-30', gender: 'female', phone: '086-333-4444' },
      { hn: 'HN-2567-005', cid: '1100100000005', first_name: 'บุญมี',  last_name: 'ขยันทำงาน', dob: '1955-09-18', gender: 'male',   phone: '082-555-6666' },
      { hn: 'HN-2567-006', cid: '1100100000006', first_name: 'สมศรี',  last_name: 'ฉุกเฉิน',   dob: '1963-01-12', gender: 'female', phone: '085-777-8888' },
    ];

    const patientIds = [];
    for (const p of patientSamples) {
      const unitId = units[Math.floor(Math.random() * units.length)].id;
      const [ex] = await conn.execute('SELECT id FROM patient WHERE hn_number=?', [p.hn]);
      let pid;
      if (ex.length === 0) {
        const [r] = await conn.execute(
          'INSERT INTO patient (service_unit_id, hn_number, cid, first_name, last_name, date_of_birth, gender, phone) VALUES (?,?,?,?,?,?,?,?)',
          [unitId, p.hn, p.cid, p.first_name, p.last_name, p.dob, p.gender, p.phone]
        );
        pid = r.insertId;
        console.log(`Inserted patient: ${p.hn}`);
      } else {
        pid = ex[0].id;
      }
      patientIds.push({ id: pid, service_unit_id: unitId });
    }

    // ---- 5. Patient Disease Groups ----
    for (let i = 0; i < patientIds.length; i++) {
      const p = patientIds[i];
      const d = diseaseRows[i % diseaseRows.length];
      const [ex] = await conn.execute('SELECT 1 FROM patient_disease_groups WHERE patient_id=? AND disease_id=?', [p.id, d.id]);
      if (ex.length === 0) {
        await conn.execute(
          'INSERT INTO patient_disease_groups (patient_id, disease_id, diagnosed_date, notes) VALUES (?,?,?,?)',
          [p.id, d.id, '2024-01-01', 'ตรวจพบจากการตรวจสุขภาพประจำปี']
        );
      }
    }

    // ---- 6. Appointments ----
    const apptTypes = ['ตรวจทั่วไป', 'รับยา', 'ตรวจเลือด', 'ติดตามอาการ'];
    const apptStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    for (let i = 0; i < patientIds.length; i++) {
      const p = patientIds[i];
      const doctorId = users[i % users.length].id;
      const dateOffset = (i - 2) * 5; // past and future
      const apptDate = new Date();
      apptDate.setDate(apptDate.getDate() + dateOffset);
      const dateStr = apptDate.toISOString().slice(0, 10) + ` ${9 + i}:00:00`;
      const status = apptStatuses[i % apptStatuses.length];
      const reason = apptTypes[i % apptTypes.length];

      const [ex] = await conn.execute(
        'SELECT id FROM appointments WHERE patient_id=? AND appointment_date=?', [p.id, dateStr]
      );
      if (ex.length === 0) {
        await conn.execute(
          'INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, status) VALUES (?,?,?,?,?)',
          [p.id, doctorId, dateStr, reason, status]
        );
        console.log(`Inserted appointment for patient ${p.id}`);
      }
    }

    // ---- 7. Referrals ----
    const refStatuses = ['pending', 'accepted', 'completed', 'rejected'];
    for (let i = 0; i < Math.min(patientIds.length, units.length - 1); i++) {
      const p = patientIds[i];
      const fromUnit = units[i % units.length].id;
      const toUnit = units[(i + 1) % units.length].id;
      const refUser = users[i % users.length].id;
      const refDate = new Date();
      refDate.setDate(refDate.getDate() - i * 3);
      const dateStr = refDate.toISOString().slice(0, 19).replace('T', ' ');

      const [ex] = await conn.execute('SELECT id FROM referral WHERE patient_id=?', [p.id]);
      if (ex.length === 0) {
        await conn.execute(
          'INSERT INTO referral (patient_id, from_service_unit_id, to_service_unit_id, referred_by_user_id, referral_date, reason, status) VALUES (?,?,?,?,?,?,?)',
          [p.id, fromUnit, toUnit, refUser, dateStr,
           ['น้ำตาลในเลือดสูงมาก', 'ความดันโลหิตสูงวิกฤต', 'อาการซับซ้อนต้องพบผู้เชี่ยวชาญ', 'ขอคำปรึกษาแพทย์เฉพาะทาง'][i % 4],
           refStatuses[i % refStatuses.length]]
        );
        console.log(`Inserted referral for patient ${p.id}`);
      }
    }

    // ---- 8. Tracking ----
    const healthStatuses = ['normal', 'warning', 'critical'];
    for (let i = 0; i < patientIds.length; i++) {
      const p = patientIds[i];
      const trackedBy = users[i % users.length].id;
      const trackDate = new Date();
      trackDate.setDate(trackDate.getDate() - i * 7);
      const dateStr = trackDate.toISOString().slice(0, 19).replace('T', ' ');

      const [ex] = await conn.execute('SELECT id FROM tracking WHERE patient_id=?', [p.id]);
      if (ex.length === 0) {
        await conn.execute(
          'INSERT INTO tracking (patient_id, tracked_by_user_id, tracking_date, symptoms_detail, health_status) VALUES (?,?,?,?,?)',
          [p.id, trackedBy, dateStr,
           ['ทานยาสม่ำเสมอ ผลเลือดดีขึ้น', 'ทานยาไม่สม่ำเสมอ ระดับน้ำตาลสูง', 'มีอาการบวมน้ำ ต้องติดตาม', 'ความดันคงที่ ควบคุมได้ดี'][i % 4],
           healthStatuses[i % healthStatuses.length]]
        );
        console.log(`Inserted tracking for patient ${p.id}`);
      }
    }

    console.log('\n✅ Seed completed successfully!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (conn) await conn.end();
  }
}

seed();
