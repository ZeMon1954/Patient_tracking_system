const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../db');
const {
  sendEmailNotification,
  buildUpcomingReminderEmail,
  buildMissedAppointmentEmail,
} = require('../services/notificationService');

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

async function runManualCron() {
  console.log('🚀 Starting Manual Cron Job Test...');
  
  try {
    // 1. เทสนัดหมายพรุ่งนี้
    console.log('Checking for upcoming appointments (tomorrow)...');
    const [upcoming] = await db.query(`
      SELECT a.id, a.appointment_date, a.reason, p.first_name, p.last_name, p.email
      FROM appointments a
      JOIN patient p ON a.patient_id = p.id
      WHERE DATE(a.appointment_date) = CURDATE() + INTERVAL 1 DAY
        AND a.status = 'pending'
    `);
    console.log(`Found ${upcoming.length} upcoming cases.`);

    for (const appt of upcoming) {
      if (appt.email) {
        const dateStr = new Date(appt.appointment_date).toLocaleString('th-TH');
        const content = buildUpcomingReminderEmail(`${appt.first_name} ${appt.last_name}`, dateStr, appt.reason);
        const res = await sendEmailNotification(appt.email, 'UPCOMING_REMINDER', 'แจ้งเตือน: นัดหมายของคุณกำลังจะถึงในวันพรุ่งนี้', content);
        console.log(`- Upcoming mail to ${appt.email}: ${res.success ? '✅ Success' : '❌ Failed'}`);
      }
    }

    // 2. เทสขาดนัด (เมื่อวาน)
    console.log('\nChecking for missed appointments (yesterday)...');
    const [missed] = await db.query(`
      SELECT 
        a.id, a.appointment_date, a.reason, 
        p.first_name, p.last_name, p.email as patient_email,
        (
          SELECT r.receiver_user_id 
          FROM referral r 
          WHERE r.patient_id = p.id AND r.status = 'accepted' 
          ORDER BY r.received_at DESC LIMIT 1
        ) as receiver_id,
        (
          SELECT u.email 
          FROM referral r
          JOIN user u ON r.receiver_user_id = u.id
          WHERE r.patient_id = p.id AND r.status = 'accepted'
          ORDER BY r.received_at DESC LIMIT 1
        ) as receiver_email
      FROM appointments a
      JOIN patient p ON a.patient_id = p.id
      WHERE DATE(a.appointment_date) = CURDATE() - INTERVAL 1 DAY
        AND a.status = 'pending'
    `);
    console.log(`Found ${missed.length} missed cases.`);

    for (const appt of missed) {
      const pName = `${appt.first_name} ${appt.last_name}`;
      const dateStr = new Date(appt.appointment_date).toLocaleString('th-TH');

      // ✅ 1. ส่งหาเจ้าหน้าที่
      if (appt.receiver_id) {
        console.log(`Processing case: ${pName} - Responsible Staff ID: ${appt.receiver_id}`);
        await pushInApp(
          appt.receiver_id,
          '🚨 แจ้งเตือน: ผู้ป่วยขาดนัด (ระบบเทส)',
          `ผู้ป่วย ${pName} ไม่มาตามนัดวันที่ ${dateStr}`
        );
        if (appt.receiver_email) {
          const content = buildMissedAppointmentEmail(pName, dateStr, appt.reason);
          const res = await sendEmailNotification(appt.receiver_email, 'MISSED_APPOINTMENT', `แจ้งเตือนเจ้าหน้าที่: ผู้ป่วย ${pName} ขาดนัด`, content);
          console.log(`  - Mail to staff (${appt.receiver_email}): ${res.success ? '✅ Success' : '❌ Failed'}`);
        }
      }

      // ✅ 2. ส่งหาผู้ป่วย
      if (appt.patient_email) {
        const patientContent = `
          <div style="font-family: 'IBM Plex Sans Thai', sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
            <div style="background: #c62828; padding: 24px; color: white;">
              <h2 style="margin: 0;">📋 แจ้งเตือน: ท่านไม่ได้มาตามนัดหมาย</h2>
            </div>
            <div style="padding: 24px;">
              <p>เรียน คุณ <strong>${pName}</strong></p>
              <p>ระบบพบว่าท่านไม่ได้เข้ารับการติดตามผลตามนัดหมายเมื่อวานนี้ (${dateStr})</p>
              <p style="color: #c62828; font-weight: bold;">กรุณาติดต่อเจ้าหน้าที่ รพ.สต. เพื่อทำการนัดหมายใหม่</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;">
              <p style="color: #666; font-size: 13px;">อีเมลนี้ส่งอัตโนมัติจากระบบติดตามผู้ป่วย กรุณาอย่าตอบกลับ</p>
            </div>
          </div>
        `;
        const res = await sendEmailNotification(appt.patient_email, 'MISSED_APPOINTMENT_PATIENT', `แจ้งเตือน: ท่านไม่ได้มาตามนัดหมาย (${pName})`, patientContent);
        console.log(`  - Mail to patient (${appt.patient_email}): ${res.success ? '✅ Success' : '❌ Failed'}`);
      }
    }

    console.log('\n✅ Manual Test Finished.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Manual Test Error:', err);
    process.exit(1);
  }
}

runManualCron();
