const db = require('../db');

exports.getDashboardSummary = async (req, res) => {
  try {
    // 1. Total Patients
    const [[{ total_patients }]] = await db.query('SELECT COUNT(*) AS total_patients FROM patient');

    // 2. Pending Referrals (status = pending)
    const [[{ pending_referrals }]] = await db.query("SELECT COUNT(*) AS pending_referrals FROM referral WHERE status = 'pending'");

    // 3. Today's Tracking/Visits (completed today)
    const [[{ today_visits }]] = await db.query('SELECT COUNT(*) AS today_visits FROM tracking WHERE DATE(tracking_date) = CURDATE()');

    // 4. Critical cases (from tracking where health_status = critical)
    const [[{ critical_cases }]] = await db.query("SELECT COUNT(*) AS critical_cases FROM tracking WHERE health_status = 'critical'");
    const [[{ warning_cases }]] = await db.query("SELECT COUNT(*) AS warning_cases FROM tracking WHERE health_status = 'warning'");

    res.json({
      totalPatients: total_patients || 0,
      pendingReferrals: pending_referrals || 0,
      todayVisits: today_visits || 0,
      urgency: {
        critical: critical_cases || 0,
        warning: warning_cases || 0,
        normal: (total_patients || 0) - (critical_cases || 0) - (warning_cases || 0)
      }
    });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Dashboard' });
  }
};

// กราฟที่ 1: จำนวนผู้ป่วยแยกตามกลุ่มโรค (Requirement 10.2)
exports.getDiseaseStats = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT ud.name AS label, COUNT(pdg.patient_id) AS value
      FROM underlying_disease ud
      LEFT JOIN patient_disease_groups pdg ON ud.id = pdg.disease_id
      GROUP BY ud.id
      ORDER BY value DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching disease stats' });
  }
};

// กราฟที่ 2: จำนวนนัดหมายแยกตามเดือน (Requirement 10.2)
exports.getAppointmentStats = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DATE_FORMAT(appointment_date, '%Y-%m') AS month, COUNT(*) AS count
      FROM appointments
      WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month
      ORDER BY month ASC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching appointment stats' });
  }
};

// กราฟที่ 3: จำนวนการส่งต่อแยกตามสถานะ (Requirement 10.2)
exports.getReferralStats = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT status, COUNT(*) AS count
      FROM referral
      GROUP BY status
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching referral stats' });
  }
};
