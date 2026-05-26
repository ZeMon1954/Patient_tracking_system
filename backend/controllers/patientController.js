// controllers/patientController.js
const db = require('../db');
const { sendEmailNotification, buildNewAppointmentEmail } = require('../services/notificationService');

// Helper: บันทึก In-App Notification ลงตาราง notification_system
async function pushInApp(userId, title, message) {
  try {
    await db.query(
      'INSERT INTO notification_system (user_id, title, message, is_read) VALUES (?,?,?,0)',
      [userId, title, message]
    );
  } catch (e) {
    console.error('pushInApp error:', e);
  }
}

// ============================================================
// PATIENTS CRUD
// ============================================================

// GET /api/patients - รายการผู้ป่วยทั้งหมด + กลุ่มโรค + สถานะสุขภาพ
exports.getPatients = async (req, res) => {
  try {
    const { search, disease, status } = req.query;
    const { role, service_unit_id } = req.user; // ดึงข้อมูลผู้ใช้จาก middleware
    const where = [];
    const params = [];

    // 1. กรองตามสิทธิ์ (Data Isolation)
    if (role !== 'admin' && role !== 'manager') {
      // แบบ Shared Care: เห็นคนไข้ที่ตนเองเป็นเจ้าของ OR เคยส่งตัวไป (Refer Out)
      where.push(`(p.service_unit_id = ? OR p.id IN (SELECT patient_id FROM referral WHERE from_service_unit_id = ?))`);
      params.push(service_unit_id, service_unit_id);
    }

    // 2. กรองตามการค้นหา
    if (search) {
      where.push('(p.first_name LIKE ? OR p.last_name LIKE ? OR p.hn_number LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (disease) {
      where.push('ud.name LIKE ?');
      params.push(`%${disease}%`);
    }
    if (status) {
      where.push('(SELECT health_status FROM tracking WHERE patient_id = p.id ORDER BY tracking_date DESC LIMIT 1) = ?');
      params.push(status);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await db.query(`
      SELECT
        p.id,
        p.hn_number,
        p.first_name,
        p.last_name,
        p.gender,
        p.date_of_birth,
        p.phone,
        p.address,
        p.cid,
        p.service_unit_id,
        su.name AS service_unit_name,
        GROUP_CONCAT(DISTINCT ud.name ORDER BY ud.name SEPARATOR ', ') AS disease_groups,
        COALESCE(
          (SELECT health_status FROM tracking WHERE patient_id = p.id ORDER BY tracking_date DESC LIMIT 1),
          'normal'
        ) AS health_status,
        (SELECT DATE(appointment_date) FROM appointments WHERE patient_id = p.id ORDER BY appointment_date DESC LIMIT 1) AS last_visit,
        (SELECT CASE WHEN reason LIKE '[ส่งกลับเพื่อรักษาต่อ]%' THEN 1 ELSE 0 END FROM referral WHERE patient_id = p.id ORDER BY referral_date DESC LIMIT 1) AS is_refer_back,
        p.created_at
      FROM patient p
      LEFT JOIN service_unit su ON p.service_unit_id = su.id
      LEFT JOIN patient_disease_groups pdg ON p.id = pdg.patient_id
      LEFT JOIN underlying_disease ud ON pdg.disease_id = ud.id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.id DESC
    `, params);

    res.json(rows);
  } catch (err) {
    console.error('getPatients:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// GET /api/patients/:id - ผู้ป่วยรายเดียว
exports.getPatientById = async (req, res) => {
  try {
    const { role, service_unit_id } = req.user;
    let query = `
      SELECT p.*, su.name AS service_unit_name,
      GROUP_CONCAT(pdg.disease_id) AS disease_ids
      FROM patient p
      LEFT JOIN service_unit su ON p.service_unit_id = su.id
      LEFT JOIN patient_disease_groups pdg ON p.id = pdg.patient_id
      WHERE p.id = ?
    `;
    const params = [req.params.id];

    if (role !== 'admin' && role !== 'manager') {
      // แบบ Shared Care: เห็นคนไข้ที่ตนเองเป็นเจ้าของ OR เคยส่งตัวไป (Refer Out)
      query += ` AND (p.service_unit_id = ? OR p.id IN (SELECT patient_id FROM referral WHERE from_service_unit_id = ?))`;
      params.push(service_unit_id, service_unit_id);
    }

    query += ' GROUP BY p.id';

    const [rows] = await db.query(query, params);
    if (rows.length === 0) return res.status(404).json({ message: 'ไม่พบผู้ป่วย หรือคุณไม่มีสิทธิ์เข้าถึง' });
    
    // แปลง disease_ids จาก string "1,2" เป็น array [1, 2]
    const patient = rows[0];
    patient.disease_ids = patient.disease_ids ? patient.disease_ids.split(',').map(Number) : [];
    
    res.json(patient);
  } catch (err) {
    console.error('getPatientById:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// POST /api/patients - เพิ่มผู้ป่วยใหม่
exports.createPatient = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { cid, first_name, last_name, date_of_birth, gender, phone, email, address, disease_ids } = req.body;
    let { service_unit_id } = req.body;
    const { role, service_unit_id: userUnitId } = req.user;

    // ถ้าไม่ใช่ Admin บังคับให้ใช้หน่วยบริการของตัวเอง
    if (role !== 'admin') {
      service_unit_id = userUnitId;
    }

    if (!service_unit_id) {
      return res.status(400).json({ message: 'ไม่พบข้อมูลหน่วยบริการ' });
    }

    // ตรวจสอบความถูกต้องและครบถ้วนของข้อมูลสำคัญ
    if (!cid || !cid.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกเลขบัตรประชาชน (CID)' });
    }
    if (cid.trim().length !== 13) {
      return res.status(400).json({ message: 'เลขบัตรประชาชน (CID) ต้องมี 13 หลัก' });
    }
    if (!first_name || !first_name.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อจริง' });
    }
    if (!last_name || !last_name.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกนามสกุล' });
    }
    if (!date_of_birth) {
      return res.status(400).json({ message: 'กรุณาระบุวัน/เดือน/ปีเกิด' });
    }
    if (!gender) {
      return res.status(400).json({ message: 'กรุณาระบุเพศ' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกเบอร์โทรศัพท์' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกอีเมล' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกที่อยู่โดยละเอียด' });
    }
    if (!disease_ids || !Array.isArray(disease_ids) || disease_ids.length === 0) {
      return res.status(400).json({ message: 'กรุณาเลือกกลุ่มโรคประจำตัวอย่างน้อย 1 กลุ่ม' });
    }

    // 1. ดึงข้อมูลหน่วยบริการเพื่อนำ unit_code มาทำ HN
    const [unitRows] = await connection.query('SELECT unit_code FROM service_unit WHERE id = ?', [service_unit_id]);
    if (unitRows.length === 0) {
      return res.status(404).json({ message: 'ไม่พบหน่วยบริการที่ระบุ' });
    }
    const unitCode = unitRows[0].unit_code;

    // 2. คำนวณปี พ.ศ. (2 หลักท้าย)
    const currentYearBE = new Date().getFullYear() + 543;
    const yearStr = currentYearBE.toString().slice(-2);

    // 3. หา Running Number ล่าสุดของหน่วยบริการนี้ในปีนี้
    const prefix = `${unitCode}-${yearStr}`;
    const [lastHnRows] = await connection.query(
      "SELECT hn_number FROM patient WHERE hn_number LIKE ? ORDER BY hn_number DESC LIMIT 1",
      [`${prefix}%`]
    );

    let nextRunningNumber = 1;
    if (lastHnRows.length > 0) {
      const lastHn = lastHnRows[0].hn_number;
      const parts = lastHn.split('-');
      if (parts.length > 1) {
        const runningPart = parts[1].substring(2);
        const parsed = parseInt(runningPart);
        if (!isNaN(parsed)) {
          nextRunningNumber = parsed + 1;
        }
      }
    }
    
    const hn_number = `${prefix}${nextRunningNumber.toString().padStart(5, '0')}`;

    // ตรวจสอบเลขบัตรประชาชน (CID) ซ้ำ
    if (cid) {
      const [existingCid] = await connection.query('SELECT id FROM patient WHERE cid = ?', [cid]);
      if (existingCid.length > 0) {
        await connection.rollback();
        return res.status(409).json({ message: `เลขบัตรประชาชน "${cid}" มีในระบบแล้ว` });
      }
    }

    const genderMap = { 'ชาย': 'male', 'หญิง': 'female', 'อื่นๆ': 'other', male: 'male', female: 'female', other: 'other' };
    const genderVal = genderMap[gender] || 'other';

    const [result] = await connection.query(
      'INSERT INTO patient (service_unit_id, hn_number, cid, first_name, last_name, date_of_birth, gender, phone, email, address) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [service_unit_id || null, hn_number, cid || null, first_name, last_name, date_of_birth || null, genderVal, phone || null, email || null, address || null]
    );

    const patientId = result.insertId;

    // บันทึกกลุ่มโรค
    if (disease_ids && Array.isArray(disease_ids)) {
      for (const dId of disease_ids) {
        await connection.query('INSERT INTO patient_disease_groups (patient_id, disease_id) VALUES (?,?)', [patientId, dId]);
      }
    }

    await connection.commit();
    res.status(201).json({ 
      message: 'ลงทะเบียนผู้ป่วยสำเร็จ', 
      id: patientId,
      hn_number: hn_number
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('createPatient:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลงทะเบียนผู้ป่วย' });
  } finally {
    if (connection) connection.release();
  }
};

// PUT /api/patients/:id - แก้ไขผู้ป่วย
exports.updatePatient = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { first_name, last_name, date_of_birth, gender, phone, email, address, cid, hn_number, service_unit_id, disease_ids } = req.body;

    // ตรวจสอบความถูกต้องและครบถ้วนของข้อมูลสำคัญ
    if (!cid || !cid.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกเลขบัตรประชาชน (CID)' });
    }
    if (cid.trim().length !== 13) {
      return res.status(400).json({ message: 'เลขบัตรประชาชน (CID) ต้องมี 13 หลัก' });
    }
    if (!first_name || !first_name.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อจริง' });
    }
    if (!last_name || !last_name.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกนามสกุล' });
    }
    if (!date_of_birth) {
      return res.status(400).json({ message: 'กรุณาระบุวัน/เดือน/ปีเกิด' });
    }
    if (!gender) {
      return res.status(400).json({ message: 'กรุณาระบุเพศ' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกเบอร์โทรศัพท์' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกอีเมล' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    }
    if (!address || !address.trim()) {
      return res.status(400).json({ message: 'กรุณากรอกที่อยู่โดยละเอียด' });
    }
    if (!disease_ids || !Array.isArray(disease_ids) || disease_ids.length === 0) {
      return res.status(400).json({ message: 'กรุณาเลือกกลุ่มโรคประจำตัวอย่างน้อย 1 กลุ่ม' });
    }

    // ตรวจสอบเลขบัตรประชาชน (CID) ซ้ำสำหรับคนไข้อื่น
    if (cid) {
      const [existingCid] = await connection.query('SELECT id FROM patient WHERE cid = ? AND id != ?', [cid, req.params.id]);
      if (existingCid.length > 0) {
        await connection.rollback();
        return res.status(409).json({ message: `เลขบัตรประชาชน "${cid}" มีในระบบสำหรับคนไข้อื่นแล้ว` });
      }
    }

    const genderMap = { 'ชาย': 'male', 'หญิง': 'female', 'อื่นๆ': 'other', male: 'male', female: 'female', other: 'other' };
    const genderVal = genderMap[gender] || 'other';

    const [result] = await connection.query(
      'UPDATE patient SET first_name=?, last_name=?, date_of_birth=?, gender=?, phone=?, email=?, address=?, cid=?, hn_number=?, service_unit_id=?, updated_at=NOW() WHERE id=?',
      [first_name, last_name, date_of_birth || null, genderVal, phone || null, email || null, address || null, cid || null, hn_number, service_unit_id || null, req.params.id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'ไม่พบผู้ป่วย' });
    }

    // อัปเดตกลุ่มโรค (ลบของเดิมแล้วบันทึกใหม่)
    await connection.query('DELETE FROM patient_disease_groups WHERE patient_id = ?', [req.params.id]);
    if (disease_ids && Array.isArray(disease_ids)) {
      for (const dId of disease_ids) {
        await connection.query('INSERT INTO patient_disease_groups (patient_id, disease_id) VALUES (?,?)', [req.params.id, dId]);
      }
    }

    await connection.commit();
    res.json({ message: 'อัปเดตข้อมูลสำเร็จ' });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('updatePatient:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  } finally {
    if (connection) connection.release();
  }
};

// DELETE /api/patients/:id - ลบผู้ป่วย
exports.deletePatient = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // ลบข้อมูลที่เชื่อมโยง
    await connection.query('DELETE FROM patient_disease_groups WHERE patient_id=?', [req.params.id]);
    await connection.query('DELETE FROM appointments WHERE patient_id=?', [req.params.id]);
    await connection.query('DELETE FROM tracking WHERE patient_id=?', [req.params.id]);
    await connection.query('DELETE FROM referral WHERE patient_id=?', [req.params.id]);

    const [result] = await connection.query('DELETE FROM patient WHERE id=?', [req.params.id]);
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'ไม่พบผู้ป่วย' });
    }

    await connection.commit();
    res.json({ message: 'ลบผู้ป่วยสำเร็จ' });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('deletePatient:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบผู้ป่วย' });
  } finally {
    if (connection) connection.release();
  }
};

// ============================================================
// APPOINTMENTS CRUD
// ============================================================

// GET /api/patients/:id/appointments - ประวัตินัดหมายของผู้ป่วย
exports.getAppointments = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        a.id,
        DATE(a.appointment_date) AS appointment_date,
        TIME(a.appointment_date) AS appointment_time,
        a.reason,
        a.status,
        CONCAT(u.first_name, ' ', u.last_name) AS doctor_name,
        u.id AS doctor_id,
        a.created_at,
        a.updated_at
      FROM appointments a
      LEFT JOIN user u ON a.doctor_id = u.id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    console.error('getAppointments:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// POST /api/patients/:id/appointments - สร้างการนัดหมาย
exports.createAppointment = async (req, res) => {
  try {
    const patientId = req.params.id;
    const { appointment_date, appointment_time, reason, doctor_id } = req.body;

    if (!appointment_date) {
      return res.status(400).json({ message: 'กรุณาระบุวันที่นัดหมาย' });
    }

    const datetime = appointment_time
      ? `${appointment_date} ${appointment_time}:00`
      : `${appointment_date} 08:00:00`;

    const [result] = await db.query(
      'INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, status) VALUES (?,?,?,?,?)',
      [patientId, doctor_id || null, datetime, reason || null, 'pending']
    );

    // ✅ ดึงข้อมูลเพื่อส่งการแจ้งเตือน
    try {
      const [patientRows] = await db.query('SELECT first_name, last_name, email FROM patient WHERE id = ?', [patientId]);
      if (patientRows.length > 0) {
        const pName = `${patientRows[0].first_name} ${patientRows[0].last_name}`;
        const pEmail = patientRows[0].email;
        
        let doctorName = '-';
        let doctorEmail = null;
        if (doctor_id) {
          const [docRows] = await db.query('SELECT first_name, last_name, email FROM user WHERE id = ?', [doctor_id]);
          if (docRows.length > 0) {
            doctorName = `${docRows[0].first_name} ${docRows[0].last_name}`;
            doctorEmail = docRows[0].email;
          }
        }
        
        const dateStr = new Date(datetime).toLocaleString('th-TH');
        const content = buildNewAppointmentEmail(pName, dateStr, reason, doctorName);
        
        // 1. ส่งอีเมลคนไข้ (ถ้ามีเมล)
        if (pEmail) {
          sendEmailNotification(
            pEmail, 
            'NEW_APPOINTMENT', 
            'ยืนยันการนัดหมายใหม่', 
            content
          ).catch(console.error);
        }
        
        // 2. ส่งอีเมลแพทย์/เจ้าหน้าที่ผู้รักษานัด (ถ้ามีเมล)
        if (doctorEmail) {
          sendEmailNotification(
            doctorEmail, 
            'NEW_APPOINTMENT_STAFF', 
            'แจ้งเตือน: การนัดหมายใหม่ของคุณ', 
            content
          ).catch(console.error);
        }

        // 3. บันทึก In-App Notification ให้แพทย์ที่รับผิดชอบ
        if (doctor_id) {
          pushInApp(doctor_id, 'นัดหมายใหม่', `มีการนัดหมายใหม่สำหรับ ${pName} วันที่ ${new Date(datetime).toLocaleString('th-TH')}`);
        }
      }
    } catch (e) {
      console.error('Email send logic failed:', e);
    }

    res.status(201).json({ message: 'บันทึกการนัดหมายสำเร็จ', id: result.insertId });
  } catch (err) {
    console.error('createAppointment:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// PUT /api/patients/:patientId/appointments/:apptId - แก้ไขนัดหมาย
exports.updateAppointment = async (req, res) => {
  try {
    const { appointment_date, appointment_time, reason, status, doctor_id } = req.body;

    const datetime = appointment_time
      ? `${appointment_date} ${appointment_time}:00`
      : `${appointment_date} 08:00:00`;

    const [result] = await db.query(
      'UPDATE appointments SET appointment_date=?, reason=?, status=?, doctor_id=?, updated_at=NOW() WHERE id=? AND patient_id=?',
      [datetime, reason || null, status || 'pending', doctor_id || null, req.params.apptId, req.params.id]
    );

    if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบการนัดหมาย' });
    res.json({ message: 'อัปเดตการนัดหมายสำเร็จ' });
  } catch (err) {
    console.error('updateAppointment:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// DELETE /api/patients/:patientId/appointments/:apptId - ลบนัดหมาย
exports.deleteAppointment = async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM appointments WHERE id=? AND patient_id=?',
      [req.params.apptId, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ message: 'ไม่พบการนัดหมาย' });
    res.json({ message: 'ลบการนัดหมายสำเร็จ' });
  } catch (err) {
    console.error('deleteAppointment:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// GET /api/patients/service-units - รายการหน่วยบริการ
exports.getServiceUnits = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, name, unit_code FROM service_unit WHERE status='Active' ORDER BY name");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// GET /api/patients/doctors - รายการเจ้าหน้าที่
exports.getDoctors = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, first_name, last_name, role FROM user ORDER BY first_name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// GET /api/patients/diseases - รายการกลุ่มโรคทั้งหมด
exports.getDiseases = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, icd10_code, description FROM underlying_disease ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error('getDiseases:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// POST /api/patients/diseases - เพิ่มกลุ่มโรคใหม่
exports.createDisease = async (req, res) => {
  try {
    const { name, icd10_code, description } = req.body;
    if (!name) return res.status(400).json({ message: 'กรุณาระบุชื่อโรค' });

    const [result] = await db.query(
      'INSERT INTO underlying_disease (name, icd10_code, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=name, icd10_code=COALESCE(icd10_code, VALUES(icd10_code)), description=COALESCE(description, VALUES(description))',
      [name, icd10_code || null, description || null]
    );
    
    // ถ้า Insert ใหม่ (affectedRows = 1) หรือมีอยู่แล้ว (affectedRows = 0 หรือ 2)
    // ค้นหา ID กลับไปให้
    const [rows] = await db.query('SELECT id, name, icd10_code, description FROM underlying_disease WHERE name = ?', [name]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createDisease:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};
