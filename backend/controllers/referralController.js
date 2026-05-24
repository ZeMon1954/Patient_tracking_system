// controllers/referralController.js
const db = require('../db');
const { sendEmailNotification, buildNewReferralEmail, buildPatientReferralEmail, buildReferralStatusEmail } = require('../services/notificationService');

// Helper: บันทึก In-App Notification
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

// GET /api/referrals/inbox - ดึงรายการส่งตัวมาที่หน่วยบริการ
exports.getInbox = async (req, res) => {
  try {
    const { role, service_unit_id: userUnitId } = req.user;
    const { unit_id } = req.query;
    const params = [];
    const where = [];
    
    // 1. กรองตามสิทธิ์
    if (role === 'pcu_staff') {
      // PCU Staff เห็นเฉพาะที่ส่งมาหาหน่วยตัวเอง
      where.push('r.to_service_unit_id = ?');
      params.push(userUnitId);
    } else if (role === 'hospital_staff') {
      // Hospital Staff เห็นทั้งที่ตัวเองส่งออก และที่อาจจะส่งกลับมา (ถ้ามี)
      where.push('(r.from_service_unit_id = ? OR r.to_service_unit_id = ?)');
      params.push(userUnitId, userUnitId);
    } else if (unit_id && (role === 'admin' || role === 'manager')) {
      // Admin/Manager กรองตามหน่วยที่เลือก
      where.push('r.to_service_unit_id = ?');
      params.push(unit_id);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [rows] = await db.query(`
      SELECT 
        r.id,
        r.referral_date,
        r.received_at,
        r.reason,
        r.status,
        p.id AS patient_id,
        p.hn_number,
        p.first_name,
        p.last_name,
        p.cid,
        p.phone,
        p.address,
        TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) AS age,
        p.gender,
        su_from.name AS from_unit_name,
        su_to.name AS to_unit_name,
        CONCAT(u_ref.first_name, ' ', u_ref.last_name) AS referred_by_name,
        u_ref.role AS referred_by_role,
        CONCAT(u_rec.first_name, ' ', u_rec.last_name) AS receiver_name,
        GROUP_CONCAT(DISTINCT ud.name SEPARATOR ', ') AS disease_groups
      FROM referral r
      LEFT JOIN patient p ON r.patient_id = p.id
      LEFT JOIN service_unit su_from ON r.from_service_unit_id = su_from.id
      LEFT JOIN service_unit su_to ON r.to_service_unit_id = su_to.id
      LEFT JOIN user u_ref ON r.referred_by_user_id = u_ref.id
      LEFT JOIN user u_rec ON r.receiver_user_id = u_rec.id
      LEFT JOIN patient_disease_groups pdg ON p.id = pdg.patient_id
      LEFT JOIN underlying_disease ud ON pdg.disease_id = ud.id
      ${whereClause}
      GROUP BY r.id
      ORDER BY r.status = 'pending' DESC, r.referral_date DESC
    `, params);

    res.json(rows);
  } catch (err) {
    console.error('getInbox:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// PUT /api/referrals/:id/status - อัปเดตสถานะการส่งตัว (รับ/ปฏิเสธ)
exports.updateStatus = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { status, reject_reason } = req.body;
    const { id: userId } = req.user; // ดึง User ID จาก Token
    
    if (!['accepted', 'rejected'].includes(status)) {
      await connection.rollback();
      return res.status(400).json({ message: 'สถานะไม่ถูกต้อง' });
    }

    let updateQuery = 'UPDATE referral SET status = ?, receiver_user_id = ?, received_at = NOW() WHERE id = ?';
    let params = [status, userId, req.params.id];

    // ถ้ากดรับ (accepted) ให้ย้ายหน่วยบริการหลักของผู้ป่วยมาที่หน่วยนี้ด้วย เพื่อให้ปรากฏในรายชื่อผู้ป่วยของหน่วย
    if (status === 'accepted') {
      const [refData] = await connection.query('SELECT patient_id, to_service_unit_id FROM referral WHERE id = ?', [req.params.id]);
      if (refData.length > 0) {
        await connection.query('UPDATE patient SET service_unit_id = ? WHERE id = ?', [refData[0].to_service_unit_id, refData[0].patient_id]);
      }
    }

    // ถ้าปฏิเสธ ให้เพิ่มเหตุผลต่อท้าย reason เดิม
    if (status === 'rejected' && reject_reason) {
      updateQuery = 'UPDATE referral SET status = ?, receiver_user_id = ?, received_at = NOW(), reason = CONCAT(reason, ?) WHERE id = ?';
      params = [status, userId, `\n\n[เหตุผลที่ปฏิเสธ: ${reject_reason}]`, req.params.id];
    }

    const [result] = await connection.query(updateQuery, params);
    
    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'ไม่พบรายการส่งตัว' });
    }

    await connection.commit();

    // ✅ ส่งการแจ้งเตือนกลับไปยังผู้ส่ง (เจ้าหน้าที่ต้นทาง) - ทำงานเป็น Background
    try {
      const [refInfo] = await db.query(`
        SELECT r.referred_by_user_id, p.first_name, p.last_name, su.name as to_unit_name, u.email as sender_email
        FROM referral r
        JOIN patient p ON r.patient_id = p.id
        JOIN service_unit su ON r.to_service_unit_id = su.id
        JOIN user u ON r.referred_by_user_id = u.id
        WHERE r.id = ?
      `, [req.params.id]);

      if (refInfo.length > 0) {
        const { referred_by_user_id, first_name, last_name, to_unit_name, sender_email } = refInfo[0];
        const pName = `${first_name} ${last_name}`;
        const statusMsg = status === 'accepted' ? 'ตอบรับแล้ว' : 'ถูกปฏิเสธ';

        // 1. ส่ง In-App Notification
        await pushInApp(
          referred_by_user_id,
          'อัปเดตสถานะการส่งตัว',
          `เคสส่งตัวของ ${pName} ไปยัง ${to_unit_name} ${statusMsg}`
        );

        // 2. ส่ง Email (ถ้าผู้ส่งมีอีเมล)
        if (sender_email) {
          const emailContent = buildReferralStatusEmail(pName, to_unit_name, status, reject_reason);
          sendEmailNotification(
            sender_email,
            'REFERRAL_STATUS_UPDATE',
            `แจ้งเตือน: เคสส่งตัว ${pName} ${statusMsg}`,
            emailContent
          ).catch(console.error);
        }
      }
    } catch (notificationError) {
      console.error('Notification after updateStatus failed:', notificationError);
    }
    
    res.json({ 
      message: status === 'accepted' ? 'รับงานสำเร็จ' : 'ปฏิเสธงานสำเร็จ',
      receiver_user_id: userId
    });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error('updateStatus:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  } finally {
    if (connection) connection.release();
  }
};

// POST /api/referrals - สร้างการส่งตัวใหม่ (จาก Hospital -> PCU)
exports.createReferral = async (req, res) => {
  try {
    const { patient_id, appointment_id, to_service_unit_id, referral_date, referral_time, reason, urgency_level } = req.body;
    const { id: userId, service_unit_id: userUnitId } = req.user;
    
    if (!patient_id || !to_service_unit_id || !referral_date) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
    }

    const datetime = referral_time
      ? `${referral_date} ${referral_time}:00`
      : `${referral_date} 08:00:00`;

    const level = urgency_level === 'urgent' ? 'urgent' : 'normal';
    const [result] = await db.query(
      'INSERT INTO referral (patient_id, appointment_id, from_service_unit_id, to_service_unit_id, referred_by_user_id, referral_date, reason, urgency_level, status) VALUES (?,?,?,?,?,?,?,?,?)',
      [patient_id, appointment_id || null, userUnitId, to_service_unit_id, userId, datetime, reason || null, level, 'pending']
    );

    // ✅ ส่งอีเมลแจ้งเตือนหน่วยบริการปลายทาง
    try {
      // ค้นหาอีเมลของเจ้าหน้าที่หรือผู้จัดการในหน่วยบริการปลายทาง
      const [managers] = await db.query(
        'SELECT email FROM user WHERE service_unit_id = ? AND role IN ("manager", "hospital_staff", "pcu_staff") AND email IS NOT NULL',
        [to_service_unit_id]
      );
      
      // ดึงข้อมูลพื้นฐานที่จำเป็นสำหรับการแจ้งเตือนทั้ง Email และ In-App
      const [patientInfo] = await db.query('SELECT first_name, last_name, email FROM patient WHERE id = ?', [patient_id]);
      const pName = patientInfo[0] ? `${patientInfo[0].first_name} ${patientInfo[0].last_name}` : 'ไม่ระบุ';
      const pEmail = patientInfo[0] ? patientInfo[0].email : null;

      // ดึงข้อมูลหน่วยบริการ เพื่อใช้ในอีเมล
      const [fromUnit] = await db.query('SELECT name FROM service_unit WHERE id = ?', [userUnitId]);
      const [toUnit] = await db.query('SELECT name FROM service_unit WHERE id = ?', [to_service_unit_id]);
      
      const fUnitName = fromUnit[0] ? fromUnit[0].name : 'ไม่ระบุ';
      const tUnitName = toUnit[0] ? toUnit[0].name : 'ไม่ระบุ';
      const dateStr = new Date(datetime).toLocaleString('th-TH');

      // ✅ 1. ส่งอีเมลแจ้งเตือนคนไข้ (ถ้ามีเมล)
      if (pEmail) {
        const patientContent = buildPatientReferralEmail(pName, fUnitName, tUnitName, reason, dateStr);
        sendEmailNotification(
          pEmail,
          'NEW_REFERRAL_PATIENT',
          'แจ้งเตือน: รายการส่งต่อข้อมูลสุขภาพของคุณ',
          patientContent
        ).catch(console.error);
      }

      // ✅ 2. ส่งอีเมลแจ้งเตือนหน่วยบริการปลายทาง
      if (managers.length > 0) {
        const content = buildNewReferralEmail(pName, fUnitName, tUnitName, reason, dateStr);

        // ส่งหาทุกคนที่มีอีเมลในหน่วยนั้น (ทำงาน background)
        for (const manager of managers) {
          sendEmailNotification(
            manager.email,
            'NEW_REFERRAL',
            'แจ้งเตือน: มีเคสส่งต่อผู้ป่วยมาใหม่',
            content
          ).catch(console.error);
        }
      }

      // ✅ บันทึก In-App ให้ทุกคนในหน่วยบริการปลายทาง (ไม่ว่าจะมีอีเมลหรือไม่)
      const [allTargetUsers] = await db.query(
        'SELECT id FROM user WHERE service_unit_id = ? AND role IN ("manager", "hospital_staff", "pcu_staff")',
        [to_service_unit_id]
      );
      
      for (const u of allTargetUsers) {
        pushInApp(u.id, 'เคสส่งต่อใหม่', `มีผู้ป่วย ${pName} ถูกส่งต่อมายังหน่วยของคุณ`);
      }
    } catch (e) {
      console.error('Referral Email logic failed:', e);
    }

    res.status(201).json({ message: 'สร้างรายการส่งตัวสำเร็จ', id: result.insertId });
  } catch (err) {
    console.error('createReferral:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสร้างรายการส่งตัว' });
  }
};

