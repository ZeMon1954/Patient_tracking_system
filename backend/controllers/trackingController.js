// controllers/trackingController.js
const db = require('../db');
const supabase = require('../utils/supabaseClient');

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


// POST /api/tracking - บันทึกผลการติดตาม/เยี่ยมบ้าน
exports.createTracking = async (req, res) => {
  const connection = await db.getConnection(); // Use transaction
  try {
    await connection.beginTransaction();

    const { 
      patient_id, 
      appointment_id, 
      tracking_date, 
      symptoms_detail, 
      health_status, 
      bp_sys, 
      bp_dia, 
      sugar, 
      weight, 
      problems, 
      advice, 
      location, 
      next_appointment_date 
    } = req.body;
    
    const { id: userId } = req.user;
    
    // 1. บันทึกลงตาราง tracking
    const [result] = await connection.query(
      `INSERT INTO tracking 
        (patient_id, appointment_id, tracked_by_user_id, tracking_date, symptoms_detail, health_status, 
         bp_sys, bp_dia, sugar, weight, problems, advice, location, next_appointment_date) 
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        patient_id, 
        appointment_id || null, 
        userId, 
        tracking_date || new Date(), 
        symptoms_detail || null, 
        health_status || 'normal',
        bp_sys || null,
        bp_dia || null,
        sugar || null,
        weight || null,
        problems || null,
        advice || null,
        location || null,
        next_appointment_date || null
      ]
    );

    const trackingId = result.insertId;

    // 2. จัดการรูปภาพ (ถ้ามี) - บันทึกลงตาราง image ที่คุณออกแบบไว้
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileExt = file.originalname.split('.').pop();
        const fileName = `${file.fieldname}-${uniqueSuffix}.${fileExt}`;

        // อัปโหลดขึ้น Supabase Storage
        const { data, error } = await supabase.storage
          .from('patient_images')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (error) {
          console.error("Supabase Upload Error:", error);
          throw new Error("อัปโหลดรูปภาพไม่สำเร็จ");
        }

        // ดึง Public URL ของรูปภาพ
        const { data: urlData } = supabase.storage
          .from('patient_images')
          .getPublicUrl(fileName);
        
        const publicUrl = urlData.publicUrl;

        await connection.query(
          `INSERT INTO image 
            (reference_type, reference_id, file_name, file_path, file_type, uploaded_by, uploaded_at) 
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          ['tracking', trackingId, fileName, publicUrl, file.mimetype, userId]
        );
      }
    }

    // 3. ถ้ามีการนัดหมายที่เกี่ยวข้อง ให้อัปเดตสถานะเป็น completed (Requirement 8)
    if (appointment_id) {
      await connection.query(
        "UPDATE appointments SET status = 'completed', updated_at = NOW() WHERE id = ?",
        [appointment_id]
      );
    }

    // 4. ถ้าเป็นเคสส่งต่อ (Referral) และบันทึกผลโดยปลายทาง ให้จบงานส่งต่อด้วย
    // ค้นหา referral ที่เกี่ยวข้องกับ patient_id นี้และยังมีสถานะ accepted
    const [referrals] = await connection.query(
      "SELECT id FROM referral WHERE patient_id = ? AND status = 'accepted' ORDER BY referral_date DESC LIMIT 1",
      [patient_id]
    );
    if (referrals.length > 0) {
      await connection.query(
        "UPDATE referral SET status = 'completed' WHERE id = ?",
        [referrals[0].id]
      );
    }

    // 5. ระบบส่งตัวกลับโรงพยาบาล (Refer Back) อัตโนมัติ (หากมีการเลือกฟังก์ชันนี้)
    const { is_refer_back, refer_back_reason } = req.body;
    let referBackCreated = false;
    let newReferralId = null;
    let hospitalUnitId = null;

    if (is_refer_back === true || is_refer_back === 'true') {
      // 5.1 ค้นหาประวัติการส่งตัวล่าสุดของคนไข้ เพื่อดูว่าโรงพยาบาลไหนเป็นผู้ส่งมาตอนแรก
      const [origReferral] = await connection.query(
        `SELECT from_service_unit_id, referred_by_user_id 
         FROM referral 
         WHERE patient_id = ? AND status IN ('accepted', 'completed') 
         ORDER BY referral_date DESC LIMIT 1`,
        [patient_id]
      );

      // ดึงรหัส รพ.สต. ปัจจุบันของคนไข้
      const [patientData] = await connection.query(
        'SELECT service_unit_id FROM patient WHERE id = ?',
        [patient_id]
      );

      const pcuUnitId = patientData[0] ? patientData[0].service_unit_id : req.user.service_unit_id;
      hospitalUnitId = origReferral[0] ? origReferral[0].from_service_unit_id : null;

      if (hospitalUnitId) {
        const reasonStr = refer_back_reason || symptoms_detail || 'พบภาวะแทรกซ้อนหรืออาการทรุดลงจากการลงเยี่ยมบ้าน';
        
        // 5.2 สร้างข้อมูลการส่งต่อกลับ (Refer Back) ลงในตาราง referral
        const [refResult] = await connection.query(
          `INSERT INTO referral 
            (patient_id, appointment_id, from_service_unit_id, to_service_unit_id, referred_by_user_id, referral_date, reason, urgency_level, status) 
           VALUES (?, ?, ?, ?, ?, NOW(), ?, 'critical', 'pending')`,
          [
            patient_id,
            appointment_id || null,
            pcuUnitId,       // รพ.สต. เป็นผู้ส่งกลับ
            hospitalUnitId, // ส่งกลับไปยังโรงพยาบาลเดิม
            userId,          // เจ้าหน้าที่ รพ.สต. เป็นผู้กดส่ง
            `[ส่งกลับเพื่อรักษาต่อ] ${reasonStr}`
          ]
        );
        newReferralId = refResult.insertId;
        referBackCreated = true;

        // 5.3 ส่งตัวผู้ป่วยกลับคืนโรงพยาบาลเดิมทันที (ปรับ service_unit_id กลับเป็นของโรงพยาบาล)
        await connection.query(
          'UPDATE patient SET service_unit_id = ? WHERE id = ?',
          [hospitalUnitId, patient_id]
        );
      }
    }

    await connection.commit();

    // 6. ส่งแจ้งเตือนสำหรับการส่งตัวกลับโรงพยาบาล (Refer Back Notification)
    if (referBackCreated && newReferralId) {
      try {
        // ดึงข้อมูลเพื่อส่งการแจ้งเตือน
        const [refInfo] = await db.query(`
          SELECT p.first_name, p.last_name, su_from.name AS from_unit_name, su_to.name AS to_unit_name, r.reason
          FROM referral r
          JOIN patient p ON r.patient_id = p.id
          JOIN service_unit su_from ON r.from_service_unit_id = su_from.id
          JOIN service_unit su_to ON r.to_service_unit_id = su_to.id
          WHERE r.id = ?
        `, [newReferralId]);

        if (refInfo.length > 0) {
          const { first_name, last_name, from_unit_name, to_unit_name, reason: refReason } = refInfo[0];
          const pName = `${first_name} ${last_name}`;

          // ค้นหาเจ้าหน้าที่ทุกคนในโรงพยาบาลเป้าหมายเพื่อส่ง In-App
          const [hospitalStaff] = await db.query(
            'SELECT id, email FROM user WHERE service_unit_id = ? AND role IN ("manager", "hospital_staff")',
            [hospitalUnitId]
          );

          const title = '⚠️ เคสส่งกลับด่วน (Refer Back)';
          const msg = `ผู้ป่วย ${pName} ถูกส่งกลับตัวจาก ${from_unit_name} เนื่องจาก: ${refReason.replace('[ส่งกลับเพื่อรักษาต่อ] ', '')}`;

          // ส่ง In-App ให้เจ้าหน้าที่ทุกคนใน รพ. ปลายทาง
          for (const staff of hospitalStaff) {
            await pushInApp(staff.id, title, msg);
          }

          // ส่งอีเมล (ถ้ามีอีเมลแจ้งเตือนในระบบและมี service)
          try {
            const { sendEmailNotification, buildNewReferralEmail } = require('../services/notificationService');
            const dateStr = new Date().toLocaleString('th-TH');
            const emailContent = buildNewReferralEmail(pName, from_unit_name, to_unit_name, refReason, dateStr);

            for (const staff of hospitalStaff) {
              if (staff.email) {
                sendEmailNotification(
                  staff.email,
                  'REFER_BACK_ALERT',
                  `[ส่งกลับด่วน] แจ้งเตือน: มีเคสส่งกลับผู้ป่วย ${pName}`,
                  emailContent
                ).catch(console.error);
              }
            }
          } catch (emailErr) {
            console.error('Refer back email failed:', emailErr);
          }
        }
      } catch (notifErr) {
        console.error('Refer back notification process failed:', notifErr);
      }
    }

    res.status(201).json({ 
      message: referBackCreated 
        ? 'บันทึกผลการติดตามและสร้างรายการส่งตัวกลับโรงพยาบาลด่วนเรียบร้อยแล้ว' 
        : 'บันทึกผลการติดตามและอัปเดตสถานะนัดหมายเรียบร้อยแล้ว', 
      id: trackingId,
      refer_back_created: referBackCreated,
      referral_id: newReferralId
    });
  } catch (err) {
    await connection.rollback();
    console.error('createTracking:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกผลการติดตาม', error: err.message, stack: err.stack });
  } finally {
    connection.release();
  }
};

// GET /api/tracking/pcu/:unit_id - ดึงรายชื่อผู้ป่วยที่ต้องเยี่ยมบ้านของเจ้าหน้าที่คนนั้น
exports.getPCUPatients = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { unit_id } = req.params;

    // กรองข้อมูล: 
    // 1. ถ้าเป็น Admin/Manager เห็นทุกคนในหน่วยนั้น
    // 2. ถ้าเป็น Staff เห็นเฉพาะเคสที่ตัวเองกดรับ (receiver_user_id)
    
    let query = `
      SELECT 
        p.id,
        p.hn_number AS hn,
        CONCAT(p.first_name, ' ', p.last_name) AS nameTh,
        TIMESTAMPDIFF(YEAR, p.date_of_birth, CURDATE()) AS age,
        GROUP_CONCAT(DISTINCT ud.name SEPARATOR ', ') AS diseaseTh,
        (SELECT tracking_date FROM tracking WHERE patient_id = p.id ORDER BY tracking_date DESC LIMIT 1) AS lastVisitDate,
        (SELECT next_appointment_date FROM tracking WHERE patient_id = p.id ORDER BY tracking_date DESC LIMIT 1) AS nextVisitDate,
        COALESCE((SELECT health_status FROM tracking WHERE patient_id = p.id ORDER BY tracking_date DESC LIMIT 1), 'normal') AS health_status,
        (SELECT received_at FROM referral WHERE patient_id = p.id AND status IN ('accepted', 'completed') ORDER BY received_at DESC LIMIT 1) AS accepted_at,
        (SELECT reason FROM referral WHERE patient_id = p.id AND status IN ('accepted', 'completed') ORDER BY referral_date DESC LIMIT 1) AS referral_reason
      FROM patient p
      LEFT JOIN patient_disease_groups pdg ON p.id = pdg.patient_id
      LEFT JOIN underlying_disease ud ON pdg.disease_id = ud.id
    `;
    
    const params = [];
    const where = ['p.service_unit_id = ?'];
    params.push(unit_id);

    // ถ้าไม่ใช่ Admin/Manager ให้ดูได้เฉพาะคนที่ตนเองเกี่ยวข้อง
    if (role !== 'admin' && role !== 'manager') {
      where.push(`
        (
          (p.service_unit_id = ? AND p.id NOT IN (SELECT patient_id FROM referral WHERE to_service_unit_id = ? AND status IN ('accepted', 'completed')))
          OR p.id IN (SELECT patient_id FROM referral WHERE to_service_unit_id = ? AND receiver_user_id = ? AND status IN ('accepted', 'completed'))
        )
      `);
      params.push(unit_id, unit_id, unit_id, userId);
    }

    const whereClause = 'WHERE ' + where.join(' AND ');
    
    // การเรียงลำดับ:
    // 1. คนที่ยังไม่เคยบันทึกผล (isNew) ให้อยู่บนสุด โดยเรียงตามวันที่รับงาน (accepted_at) หรือวันที่ลงทะเบียน
    // 2. คนที่เคยบันทึกแล้ว ให้เรียงตามวันที่เยี่ยมล่าสุด (lastVisitDate)
    const [rows] = await db.query(`
      ${query} 
      ${whereClause} 
      GROUP BY p.id 
      ORDER BY 
        (CASE WHEN (SELECT COUNT(*) FROM tracking WHERE patient_id = p.id) = 0 THEN 0 ELSE 1 END) ASC, 
        COALESCE(accepted_at, p.created_at) DESC, 
        lastVisitDate DESC
    `, params);

    const formattedRows = rows.map(r => {
      let riskStatus = 'ปกติ';
      let riskColor = 'bg-emerald-100 text-emerald-700';
      let riskDot = 'bg-emerald-500';

      if (r.health_status === 'warning') {
        riskStatus = 'ต้องติดตาม'; riskColor = 'bg-amber-100 text-amber-700'; riskDot = 'bg-amber-500';
      } else if (r.health_status === 'critical') {
        riskStatus = 'วิกฤต'; riskColor = 'bg-rose-100 text-rose-700'; riskDot = 'bg-rose-500';
      }

      return {
        id: r.id,
        hn: r.hn,
        nameTh: r.nameTh,
        age: r.age,
        diseaseTh: r.diseaseTh || 'ไม่มีโรคประจำตัว',
        referralReason: r.referral_reason,
        visitDate: r.lastVisitDate ? new Date(r.lastVisitDate).toLocaleDateString('th-TH') : 'ยังไม่ได้ทำการบันทึก',
        nextVisitDate: r.nextVisitDate ? new Date(r.nextVisitDate).toISOString().split('T')[0] : null,
        riskStatus: r.lastVisitDate ? riskStatus : 'รอการบันทึก',
        riskColor: r.lastVisitDate ? riskColor : 'bg-blue-100 text-blue-700',
        riskDot: r.lastVisitDate ? riskDot : 'bg-blue-500',
        status: 'Active',
        isNew: !r.lastVisitDate
      }
    });

    res.json(formattedRows);
  } catch (err) {
    console.error('getPCUPatients:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ป่วย' });
  }
};

// GET /api/tracking/patient/:patient_id - ดึงประวัติการติดตามรายคน (รวมประวัติการส่งตัว และประวัตินัดหมาย)
exports.getTrackingHistory = async (req, res) => {
  try {
    const { patient_id } = req.params;
    
    // ดึงข้อมูลทั้งจากตาราง tracking, referral และ appointments เพื่อโชว์เป็น Timeline เดียวกัน
    const [rows] = await db.query(`
      (
        SELECT 
          t.id,
          t.tracking_date AS date,
          'tracking' AS type,
          t.health_status,
          t.symptoms_detail,
          t.bp_sys,
          t.bp_dia,
          t.sugar,
          t.weight,
          t.problems,
          t.advice,
          t.location,
          t.next_appointment_date,
          CONCAT(u.first_name, ' ', u.last_name) AS officer_name
        FROM tracking t
        LEFT JOIN user u ON t.tracked_by_user_id = u.id
        WHERE t.patient_id = ?
      )
      UNION ALL
      (
        SELECT 
          r.id,
          r.referral_date AS date,
          'referral' AS type,
          r.status AS health_status,
          r.reason AS symptoms_detail,
          NULL AS bp_sys,
          NULL AS bp_dia,
          NULL AS sugar,
          NULL AS weight,
          NULL AS problems,
          NULL AS advice,
          CONCAT('ส่งตัวจาก: ', su_from.name, ' ไปยัง: ', su_to.name) AS location,
          NULL AS next_appointment_date,
          CONCAT(u_ref.first_name, ' ', u_ref.last_name) AS officer_name
        FROM referral r
        LEFT JOIN service_unit su_from ON r.from_service_unit_id = su_from.id
        LEFT JOIN service_unit su_to ON r.to_service_unit_id = su_to.id
        LEFT JOIN user u_ref ON r.referred_by_user_id = u_ref.id
        WHERE r.patient_id = ?
      )
      UNION ALL
      (
        SELECT 
          a.id,
          a.appointment_date AS date,
          'appointment' AS type,
          a.status AS health_status,
          a.reason AS symptoms_detail,
          NULL AS bp_sys,
          NULL AS bp_dia,
          NULL AS sugar,
          NULL AS weight,
          NULL AS problems,
          NULL AS advice,
          'รายการนัดหมายในระบบ' AS location,
          NULL AS next_appointment_date,
          CONCAT(u.first_name, ' ', u.last_name) AS officer_name
        FROM appointments a
        LEFT JOIN user u ON a.doctor_id = u.id
        WHERE a.patient_id = ?
      )
      ORDER BY date DESC
    `, [patient_id, patient_id, patient_id]);

    const formatted = rows.map(r => {
      let statusLabel = 'ปกติ';
      let statusColor = 'bg-emerald-100 text-emerald-700';
      let statusDot = 'bg-emerald-500';

      if (r.type === 'referral') {
        if (r.health_status === 'pending') {
          statusLabel = 'รอรับงาน (ส่งตัว)'; statusColor = 'bg-blue-100 text-blue-700'; statusDot = 'bg-blue-500';
        } else if (r.health_status === 'accepted') {
          statusLabel = 'รับงานแล้ว (ส่งตัว)'; statusColor = 'bg-teal-100 text-teal-700'; statusDot = 'bg-teal-500';
        } else if (r.health_status === 'rejected') {
          statusLabel = 'ปฏิเสธ (ส่งตัว)'; statusColor = 'bg-rose-100 text-rose-700'; statusDot = 'bg-rose-500';
        } else {
          statusLabel = 'ส่งตัวสำเร็จ'; statusColor = 'bg-slate-100 text-slate-700'; statusDot = 'bg-slate-500';
        }
      } else if (r.type === 'appointment') {
        if (r.health_status === 'pending') {
          statusLabel = 'รอนัดหมาย'; statusColor = 'bg-amber-100 text-amber-700'; statusDot = 'bg-amber-500';
        } else if (r.health_status === 'completed') {
          statusLabel = 'มาตามนัดแล้ว'; statusColor = 'bg-emerald-100 text-emerald-700'; statusDot = 'bg-emerald-500';
        } else if (r.health_status === 'missed') {
          statusLabel = 'ขาดนัด'; statusColor = 'bg-rose-100 text-rose-700'; statusDot = 'bg-rose-500';
        } else {
          statusLabel = 'ยกเลิกนัด'; statusColor = 'bg-slate-100 text-slate-700'; statusDot = 'bg-slate-500';
        }
      } else {
        if (r.health_status === 'warning') {
          statusLabel = 'ต้องติดตาม'; statusColor = 'bg-amber-100 text-amber-700'; statusDot = 'bg-amber-500';
        } else if (r.health_status === 'critical') {
          statusLabel = 'วิกฤต'; statusColor = 'bg-rose-100 text-rose-700'; statusDot = 'bg-rose-500';
        }
      }

      return {
        ...r,
        date: new Date(r.date).toLocaleDateString('th-TH'),
        next_appointment_date: r.next_appointment_date ? new Date(r.next_appointment_date).toLocaleDateString('th-TH') : null,
        status: statusLabel,
        statusColor,
        statusDot,
        officer: r.officer_name || 'ไม่ระบุ'
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('getTrackingHistory:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงประวัติ' });
  }
};

// GET /api/tracking/pcu/:unit_id/today-appointments - appointments due today for the PCU unit
exports.getTodayAppointments = async (req, res) => {
  try {
    const { unit_id } = req.params;
    const { id: userId, role } = req.user;

    let userFilter = '';
    const params = [unit_id];

    if (role !== 'admin' && role !== 'manager') {
      userFilter = `
        AND (
          (p.service_unit_id = ? AND p.id NOT IN (SELECT patient_id FROM referral WHERE to_service_unit_id = ? AND status IN ('accepted', 'completed')))
          OR p.id IN (SELECT patient_id FROM referral WHERE to_service_unit_id = ? AND receiver_user_id = ? AND status IN ('accepted', 'completed'))
        )
      `;
      params.push(unit_id, unit_id, unit_id, userId);
    }

    const [rows] = await db.query(`
      SELECT
        a.id,
        a.patient_id,
        DATE(a.appointment_date) AS appointment_date,
        TIME(a.appointment_date) AS appointment_time,
        a.reason,
        a.status,
        p.hn_number AS hn,
        CONCAT(p.first_name, ' ', p.last_name) AS nameTh
      FROM appointments a
      JOIN patient p ON p.id = a.patient_id
      WHERE p.service_unit_id = ?
        AND DATE(a.appointment_date) = CURDATE()
        AND a.status = 'pending'
        ${userFilter}
      ORDER BY a.appointment_date ASC
    `, params);

    res.json(rows);
  } catch (err) {
    console.error('getTodayAppointments:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลนัดหมายวันนี้' });
  }
};

// GET /api/tracking/pcu/:unit_id/missed-appointments - appointments that were missed (before today and still pending)
exports.getMissedAppointments = async (req, res) => {
  try {
    const { unit_id } = req.params;
    const { id: userId, role } = req.user;

    let userFilter = `
        AND (
          -- เป็นคนไข้เดิมของหน่วย
          p.id NOT IN (SELECT patient_id FROM referral WHERE to_service_unit_id = ? AND status IN ('accepted', 'completed'))
          OR 
          -- หรือเป็นคนไข้ส่งต่อที่ "รับงานแล้ว" (ถ้าเป็น admin/manager ดูได้หมด)
          p.id IN (SELECT patient_id FROM referral WHERE to_service_unit_id = ? AND status IN ('accepted', 'completed'))
        )
    `;
    const params = [unit_id, unit_id, unit_id];

    if (role !== 'admin' && role !== 'manager') {
      userFilter = `
        AND (
          (p.service_unit_id = ? AND p.id NOT IN (SELECT patient_id FROM referral WHERE to_service_unit_id = ? AND status IN ('accepted', 'completed')))
          OR p.id IN (SELECT patient_id FROM referral WHERE to_service_unit_id = ? AND receiver_user_id = ? AND status IN ('accepted', 'completed'))
        )
      `;
      params.push(unit_id, userId); // because params already has [unit_id, unit_id, unit_id]
    }

    const [rows] = await db.query(`
      SELECT
        a.id,
        a.patient_id,
        DATE(a.appointment_date) AS appointment_date,
        TIME(a.appointment_date) AS appointment_time,
        a.reason,
        a.status,
        p.hn_number AS hn,
        CONCAT(p.first_name, ' ', p.last_name) AS nameTh
      FROM appointments a
      JOIN patient p ON p.id = a.patient_id
      WHERE p.service_unit_id = ?
        AND DATE(a.appointment_date) < CURDATE()
        AND a.status = 'pending'
        ${userFilter}
      ORDER BY a.appointment_date DESC
    `, params);

    res.json(rows);
  } catch (err) {
    console.error('getMissedAppointments:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลนัดหมายที่ตกหล่น' });
  }
};

// GET /api/tracking/:id/attachments - ดึงไฟล์รูปภาพแนบทั้งหมดของเคสติดตามจากตาราง image ที่คุณออกแบบ
exports.getTrackingAttachments = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      "SELECT id, file_path, file_type FROM image WHERE reference_type = 'tracking' AND reference_id = ?",
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error('getTrackingAttachments error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงรูปภาพแนบ' });
    // test
    //test2
    //test
  }
};
