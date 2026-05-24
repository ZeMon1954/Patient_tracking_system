// controllers/reportController.js
const db = require('../db');
const { Parser } = require('json2csv');

// Helper function to export CSV
const exportToCsv = (res, fileName, data, fields) => {
  try {
    const json2csvParser = new Parser({ fields, withBOM: true });
    const csv = json2csvParser.parse(data);
    res.header('Content-Type', 'text/csv; charset=utf-8');
    res.attachment(fileName);
    return res.send(csv);
  } catch (err) {
    console.error('CSV Export Error:', err);
    res.status(500).json({ message: 'Error exporting CSV' });
  }
};

// ============================================================
// รายงานที่ 1: ผู้ป่วยตามกลุ่มโรค
// ============================================================
exports.report1Patients = async (req, res) => {
  try {
    const { province, district, unit, disease, status, export: exportMode } = req.query;
    const where = [];
    const params = [];

    if (province) { where.push('su.province LIKE ?'); params.push(`%${province}%`); }
    if (district) { where.push('su.district LIKE ?'); params.push(`%${district}%`); }
    if (unit)     { where.push('su.name LIKE ?');     params.push(`%${unit}%`); }
    if (disease)  { where.push('ud.name LIKE ?');     params.push(`%${disease}%`); }
    if (status)   {
      where.push('(SELECT health_status FROM tracking WHERE patient_id = p.id ORDER BY tracking_date DESC LIMIT 1) = ?');
      params.push(status);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await db.query(`
      SELECT
        p.hn_number,
        CONCAT(p.first_name, ' ', p.last_name) AS full_name,
        p.gender,
        TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) AS age,
        p.phone,
        su.name AS service_unit_name,
        GROUP_CONCAT(DISTINCT ud.name ORDER BY ud.name SEPARATOR ', ') AS disease_groups,
        COALESCE(
          (SELECT health_status FROM tracking WHERE patient_id = p.id ORDER BY tracking_date DESC LIMIT 1),
          'normal'
        ) AS health_status
      FROM patient p
      LEFT JOIN service_unit su ON p.service_unit_id = su.id
      LEFT JOIN patient_disease_groups pdg ON p.id = pdg.patient_id
      LEFT JOIN underlying_disease ud ON pdg.disease_id = ud.id
      ${whereClause}
      GROUP BY p.id, su.name, su.province, su.district
      ORDER BY p.id DESC
    `, params);

    if (exportMode === 'true') {
      const fields = [
        { label: 'HN', value: 'hn_number' },
        { label: 'ชื่อ-นามสกุล', value: 'full_name' },
        { label: 'เพศ', value: 'gender' },
        { label: 'อายุ', value: 'age' },
        { label: 'เบอร์โทร', value: 'phone' },
        { label: 'หน่วยบริการหลัก', value: 'service_unit_name' },
        { label: 'กลุ่มโรค', value: 'disease_groups' },
        { label: 'สถานะ', value: 'health_status' }
      ];
      return exportToCsv(res, 'report_patients_by_disease.csv', rows, fields);
    }

    res.json(rows);
  } catch (err) {
    console.error('report1:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// ============================================================
// รายงานที่ 2: นัดหมายผู้ป่วย
// ============================================================
exports.report2Appointments = async (req, res) => {
  try {
    const { startDate, endDate, unit, appointmentType, appointmentStatus, export: exportMode } = req.query;
    const where = [];
    const params = [];

    if (startDate)         { where.push('DATE(a.appointment_date) >= ?'); params.push(startDate); }
    if (endDate)           { where.push('DATE(a.appointment_date) <= ?'); params.push(endDate); }
    if (unit)              { where.push('su.name LIKE ?'); params.push(`%${unit}%`); }
    if (appointmentType)   { where.push('a.reason LIKE ?'); params.push(`%${appointmentType}%`); }
    if (appointmentStatus) { where.push('a.status = ?'); params.push(appointmentStatus); }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await db.query(`
      SELECT
        DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointment_date,
        DATE_FORMAT(a.appointment_date, '%H:%i') AS appointment_time,
        p.hn_number,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        a.reason AS appointment_type,
        CONCAT(u.first_name, ' ', u.last_name) AS staff_name,
        su.name AS service_unit_name,
        a.status
      FROM appointments a
      LEFT JOIN patient p ON a.patient_id = p.id
      LEFT JOIN user u ON a.doctor_id = u.id
      LEFT JOIN service_unit su ON p.service_unit_id = su.id
      ${whereClause}
      ORDER BY a.appointment_date DESC
    `, params);

    if (exportMode === 'true') {
      const fields = [
        { label: 'วันที่นัด', value: 'appointment_date' },
        { label: 'เวลา', value: 'appointment_time' },
        { label: 'HN', value: 'hn_number' },
        { label: 'ชื่อผู้ป่วย', value: 'patient_name' },
        { label: 'ประเภทนัดหมาย', value: 'appointment_type' },
        { label: 'เจ้าหน้าที่รับผิดชอบ', value: 'staff_name' },
        { label: 'หน่วยบริการ', value: 'service_unit_name' },
        { label: 'สถานะ', value: 'status' }
      ];
      return exportToCsv(res, 'report_appointments.csv', rows, fields);
    }

    res.json(rows);
  } catch (err) {
    console.error('report2:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// ============================================================
// รายงานที่ 3: ผู้ป่วยไม่มาตามนัด
// ============================================================
exports.report3Missed = async (req, res) => {
  try {
    const { startDate, endDate, unit, disease, staff, export: exportMode } = req.query;
    // ขาดนัด = นัดที่เลยวันกำหนดแล้ว และยังไม่ได้บันทึกผล (status = 'pending') หรือถูก cancelled
    const where = ["(a.status = 'cancelled' OR (a.status = 'pending' AND DATE(a.appointment_date) < CURDATE()))"];
    const params = [];

    if (startDate) { where.push('DATE(a.appointment_date) >= ?'); params.push(startDate); }
    if (endDate)   { where.push('DATE(a.appointment_date) <= ?'); params.push(endDate); }
    if (unit)      { where.push('su.name LIKE ?'); params.push(`%${unit}%`); }
    if (disease)   { where.push('ud.name LIKE ?'); params.push(`%${disease}%`); }
    if (staff)     {
      where.push("CONCAT(u.first_name, ' ', u.last_name) LIKE ?");
      params.push(`%${staff}%`);
    }

    const whereClause = 'WHERE ' + where.join(' AND ');

    const [rows] = await db.query(`
      SELECT
        DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointment_date,
        p.hn_number,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        p.phone,
        GROUP_CONCAT(DISTINCT ud.name SEPARATOR ', ') AS disease_groups,
        CONCAT(u.first_name, ' ', u.last_name) AS staff_name,
        a.reason AS note,
        (
          SELECT COUNT(*) FROM appointments a2
          WHERE a2.patient_id = p.id AND a2.status = 'cancelled'
        ) AS missed_count
      FROM appointments a
      LEFT JOIN patient p ON a.patient_id = p.id
      LEFT JOIN user u ON a.doctor_id = u.id
      LEFT JOIN service_unit su ON p.service_unit_id = su.id
      LEFT JOIN patient_disease_groups pdg ON p.id = pdg.patient_id
      LEFT JOIN underlying_disease ud ON pdg.disease_id = ud.id
      ${whereClause}
      GROUP BY a.id, p.id, u.id, su.id
      ORDER BY a.appointment_date DESC
    `, params);

    if (exportMode === 'true') {
      const fields = [
        { label: 'วันที่นัด', value: 'appointment_date' },
        { label: 'HN', value: 'hn_number' },
        { label: 'ชื่อผู้ป่วย', value: 'patient_name' },
        { label: 'เบอร์โทร', value: 'phone' },
        { label: 'กลุ่มโรค', value: 'disease_groups' },
        { label: 'เจ้าหน้าที่รับผิดชอบ', value: 'staff_name' },
        { label: 'หมายเหตุ', value: 'note' },
        { label: 'จำนวนครั้งไม่มาตามนัดสะสม', value: 'missed_count' }
      ];
      return exportToCsv(res, 'report_missed_appointments.csv', rows, fields);
    }

    res.json(rows);
  } catch (err) {
    console.error('report3:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// ============================================================
// รายงานที่ 4: การส่งต่อผู้ป่วย
// ============================================================
exports.report4Referrals = async (req, res) => {
  try {
    const { transferDate, fromUnit, toUnit, urgency, transferStatus, export: exportMode } = req.query;
    const where = [];
    const params = [];

    if (transferDate)   { where.push('DATE(r.referral_date) = ?'); params.push(transferDate); }
    if (fromUnit)       { where.push('su_from.name LIKE ?');       params.push(`%${fromUnit}%`); }
    if (toUnit)         { where.push('su_to.name LIKE ?');         params.push(`%${toUnit}%`); }
    if (transferStatus) { where.push('r.status = ?');              params.push(transferStatus); }
    if (urgency)        { where.push('r.urgency_level = ?'); params.push(urgency); }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await db.query(`
      SELECT
        DATE_FORMAT(r.referral_date, '%Y-%m-%d') AS referral_date,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        p.hn_number,
        su_from.name AS from_unit_name,
        su_to.name AS to_unit_name,
        r.reason,
        r.urgency_level,
        r.status,
        CONCAT(u_ref.first_name, ' ', u_ref.last_name) AS referred_by_name,
        DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS from_appointment_date,
        a.reason AS from_appointment_reason
      FROM referral r
      LEFT JOIN patient p ON r.patient_id = p.id
      LEFT JOIN service_unit su_from ON r.from_service_unit_id = su_from.id
      LEFT JOIN service_unit su_to ON r.to_service_unit_id = su_to.id
      LEFT JOIN user u_ref ON r.referred_by_user_id = u_ref.id
      LEFT JOIN appointments a ON r.appointment_id = a.id
      ${whereClause}
      ORDER BY r.referral_date DESC
    `, params);

    if (exportMode === 'true') {
      const fields = [
        { label: 'วันที่ส่งต่อ', value: 'referral_date' },
        { label: 'ชื่อผู้ป่วย', value: 'patient_name' },
        { label: 'HN', value: 'hn_number' },
        { label: 'หน่วยบริการต้นทาง', value: 'from_unit_name' },
        { label: 'หน่วยบริการปลายทาง', value: 'to_unit_name' },
        { label: 'เหตุผลการส่งต่อ', value: 'reason' },
        { label: 'ความเร่งด่วน', value: 'urgency_level' },
        { label: 'สถานะ', value: 'status' },
        { label: 'ผู้ส่งต่อ', value: 'referred_by_name' },
        { label: 'ส่งจากนัดหมายวันที่', value: 'from_appointment_date' },
        { label: 'รายละเอียดนัดหมายเดิม', value: 'from_appointment_reason' }
      ];
      return exportToCsv(res, 'report_referrals.csv', rows, fields);
    }

    res.json(rows);
  } catch (err) {
    console.error('report4:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// ============================================================
// รายงานที่ 5: ผลการติดตามผู้ป่วย
// ============================================================
exports.report5Tracking = async (req, res) => {
  try {
    const { followUpDate, unit, staff, needsFollowUp, export: exportMode } = req.query;
    const where = [];
    const params = [];

    if (followUpDate) { where.push('DATE(t.tracking_date) = ?');            params.push(followUpDate); }
    if (unit)         { where.push('su.name LIKE ?');                        params.push(`%${unit}%`); }
    if (staff)        {
      where.push("CONCAT(u.first_name, ' ', u.last_name) LIKE ?");
      params.push(`%${staff}%`);
    }
    if (needsFollowUp === 'ใช่')  { where.push("t.health_status IN ('warning','critical')"); }
    if (needsFollowUp === 'ไม่')  { where.push("t.health_status = 'normal'"); }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await db.query(`
      SELECT
        DATE_FORMAT(t.tracking_date, '%Y-%m-%d') AS tracking_date,
        CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
        p.hn_number,
        CONCAT(u.first_name, ' ', u.last_name) AS staff_name,
        su.name AS service_unit_name,
        t.symptoms_detail,
        t.health_status,
        CASE
          WHEN t.health_status IN ('warning','critical') THEN 'ใช่'
          ELSE 'ไม่'
        END AS needs_follow_up,
        DATE_FORMAT(DATE_ADD(t.tracking_date, INTERVAL 30 DAY), '%Y-%m-%d') AS next_tracking_date
      FROM tracking t
      LEFT JOIN patient p ON t.patient_id = p.id
      LEFT JOIN user u ON t.tracked_by_user_id = u.id
      LEFT JOIN service_unit su ON p.service_unit_id = su.id
      ${whereClause}
      ORDER BY t.tracking_date DESC
    `, params);

    if (exportMode === 'true') {
      const fields = [
        { label: 'วันที่ติดตาม', value: 'tracking_date' },
        { label: 'ชื่อผู้ป่วย', value: 'patient_name' },
        { label: 'HN', value: 'hn_number' },
        { label: 'เจ้าหน้าที่ผู้ติดตาม', value: 'staff_name' },
        { label: 'หน่วยบริการ', value: 'service_unit_name' },
        { label: 'รายละเอียดอาการ', value: 'symptoms_detail' },
        { label: 'สถานะสุขภาพ', value: 'health_status' },
        { label: 'ต้องติดตามซ้ำหรือไม่', value: 'needs_follow_up' },
        { label: 'วันที่ติดตามครั้งถัดไป', value: 'next_tracking_date' }
      ];
      return exportToCsv(res, 'report_tracking_results.csv', rows, fields);
    }

    res.json(rows);
  } catch (err) {
    console.error('report5:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// ============================================================
// Metadata: ดึง service units, disease groups, staff สำหรับ filter dropdowns
// ============================================================
exports.reportMetadata = async (req, res) => {
  try {
    const [[serviceUnits], [diseases], [staff]] = await Promise.all([
      db.query('SELECT id, name FROM service_unit ORDER BY name ASC'),
      db.query('SELECT id, name FROM underlying_disease ORDER BY name ASC'),
      db.query(`SELECT id, CONCAT(first_name, ' ', last_name) AS full_name FROM user
                WHERE role IN ('pcu_staff', 'hospital_staff') ORDER BY first_name ASC`)
    ]);
    res.json({ serviceUnits, diseases, staff });
  } catch (err) {
    console.error('reportMetadata:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};
