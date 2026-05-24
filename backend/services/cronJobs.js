const cron = require('node-cron');
const db = require('../db');
const {
  sendEmailNotification,
  buildUpcomingReminderEmail,
  buildMissedAppointmentEmail,
} = require('./notificationService');

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

async function runDailyCheck() {
  console.log('⏰ Running appointment check...');
  
  try {
    // 1. นัดหมายที่กำลังจะถึงในวันพรุ่งนี้ (Upcoming 1 day)
    // ป้องกันส่งซ้ำ: เช็คจาก notifications_log ว่าเคยส่งไปแล้วหรือยัง
    const [upcoming] = await db.query(`
      SELECT a.id, a.appointment_date, a.reason, p.first_name, p.last_name, p.email
      FROM appointments a
      JOIN patient p ON a.patient_id = p.id
      WHERE DATE(a.appointment_date) = CURDATE() + INTERVAL 1 DAY
        AND a.status = 'pending'
        AND p.email IS NOT NULL
        AND p.email NOT IN (
          SELECT recipient FROM notifications_log 
          WHERE notification_type = 'UPCOMING_REMINDER' 
            AND recipient = p.email
            AND DATE(sent_at) = CURDATE()
            AND status = 'sent'
        )
    `);

    let upcomingSent = 0;
    for (const appt of upcoming) {
      if (appt.email) {
        const dateStr = new Date(appt.appointment_date).toLocaleString('th-TH');
        const content = buildUpcomingReminderEmail(`${appt.first_name} ${appt.last_name}`, dateStr, appt.reason);
        await sendEmailNotification(appt.email, 'UPCOMING_REMINDER', 'แจ้งเตือน: นัดหมายของคุณกำลังจะถึงในวันพรุ่งนี้', content);
        upcomingSent++;
      }
    }

    // 2. นัดหมายที่ผู้ป่วยไม่มาตามนัด (Missed appointments) - ตรวจทุกนัดที่เลยกำหนดและยังไม่ได้บันทึกผล
    // ป้องกันส่งซ้ำ: ตรวจจาก notifications_log
    const [missed] = await db.query(`
      SELECT 
        a.id, a.appointment_date, a.reason, 
        p.first_name, p.last_name, p.email as patient_email,
        (
          SELECT r.receiver_user_id 
          FROM referral r 
          WHERE r.patient_id = p.id AND r.status IN ('accepted', 'completed')
          ORDER BY r.received_at DESC LIMIT 1
        ) as receiver_id,
        (
          SELECT u.email 
          FROM referral r
          JOIN user u ON r.receiver_user_id = u.id
          WHERE r.patient_id = p.id AND r.status IN ('accepted', 'completed')
          ORDER BY r.received_at DESC LIMIT 1
        ) as receiver_email
      FROM appointments a
      JOIN patient p ON a.patient_id = p.id
      WHERE DATE(a.appointment_date) < CURDATE()
        AND a.status = 'pending'
    `);

    let missedSent = 0;
    for (const appt of missed) {
      const pName = `${appt.first_name} ${appt.last_name}`;
      const dateStr = new Date(appt.appointment_date).toLocaleString('th-TH');
      const apptKey = `MISSED_APPT_${appt.id}`;

      // ✅ 1. แจ้งเตือนเจ้าหน้าที่ที่กดยอมรับเคส
      if (appt.receiver_id) {
        // เช็คว่าเคยส่ง In-App สำหรับนัดนี้หรือยัง
        const [existInApp] = await db.query(
          `SELECT id FROM notification_system WHERE user_id = ? AND title LIKE ? AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) LIMIT 1`,
          [appt.receiver_id, `%${apptKey}%`]
        );

        if (existInApp.length === 0) {
          await pushInApp(
            appt.receiver_id,
            `🚨 แจ้งเตือน: ผู้ป่วยขาดนัด [${apptKey}]`,
            `ผู้ป่วย ${pName} ไม่มาตามนัดวันที่ ${dateStr} กรุณาติดตามผล`
          );
        }

        // ส่ง Email (ถ้ายังไม่เคยส่ง)
        if (appt.receiver_email) {
          const [existMail] = await db.query(
            `SELECT id FROM notifications_log WHERE recipient = ? AND notification_type = 'MISSED_APPOINTMENT' AND subject LIKE ? AND status = 'sent' LIMIT 1`,
            [appt.receiver_email, `%[Appt-${appt.id}]%`]
          );

          if (existMail.length === 0) {
            const content = buildMissedAppointmentEmail(pName, dateStr, appt.reason);
            await sendEmailNotification(
              appt.receiver_email, 
              'MISSED_APPOINTMENT', 
              `แจ้งเตือนเจ้าหน้าที่: ผู้ป่วย ${pName} ขาดนัด [Appt-${appt.id}]`, 
              content
            );
            missedSent++;
          }
        }
      }

      // ✅ 2. แจ้งเตือนผู้ป่วย (ทางอีเมล)
      if (appt.patient_email) {
        const [existPatientMail] = await db.query(
          `SELECT id FROM notifications_log WHERE recipient = ? AND notification_type = 'MISSED_APPOINTMENT_PATIENT' AND subject LIKE ? AND status = 'sent' LIMIT 1`,
          [appt.patient_email, `%[Appt-${appt.id}]%`]
        );

        if (existPatientMail.length === 0) {
          const patientContent = `
            <div style="font-family: 'IBM Plex Sans Thai', sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
              <div style="background: #c62828; padding: 24px; color: white;">
                <h2 style="margin: 0;">📋 แจ้งเตือน: ท่านไม่ได้มาตามนัดหมาย</h2>
              </div>
              <div style="padding: 24px;">
                <p>เรียน คุณ <strong>${pName}</strong></p>
                <p>ระบบพบว่าท่านไม่ได้เข้ารับการติดตามผลตามนัดหมาย (${dateStr})</p>
                <p><strong>เหตุผลนัดหมาย:</strong> ${appt.reason || '-'}</p>
                <p style="color: #c62828; font-weight: bold;">กรุณาติดต่อเจ้าหน้าที่ รพ.สต. เพื่อทำการนัดหมายใหม่</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;">
                <p style="color: #666; font-size: 13px;">อีเมลนี้ส่งอัตโนมัติจากระบบ</p>
              </div>
            </div>
          `;
          await sendEmailNotification(
            appt.patient_email, 
            'MISSED_APPOINTMENT_PATIENT', 
            `แจ้งเตือน: ท่านไม่ได้มาตามนัดหมาย [Appt-${appt.id}]`, 
            patientContent
          );
          missedSent++;
        }
      }
    }

    console.log(`✅ Appointment check finished: Sent ${upcomingSent} upcoming, ${missedSent} missed reminders.`);
    return { upcoming: upcoming.length, missed: missed.length, sent: missedSent };
  } catch (err) {
    console.error('❌ Error in appointment check:', err);
    throw err;
  }
}

// ⏰ ตั้งเวลาให้ทำงานทุก 5 นาที (เพื่อตรวจจับเคสขาดนัดได้ไวขึ้น) - Mode เทสติงระบบ
cron.schedule('*/5 * * * *', runDailyCheck);

module.exports = {
  runDailyCheck
};
