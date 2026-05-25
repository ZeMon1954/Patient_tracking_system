// services/notificationService.js
// บริการส่งอีเมลแจ้งเตือนและบันทึกประวัติลง notifications_log ผ่าน SendGrid HTTP API
const pool = require('../db');

/**
 * ส่งอีเมลแจ้งเตือนและบันทึกลง notifications_log ผ่าน SendGrid HTTP API
 * @param {string} recipient - อีเมลผู้รับ
 * @param {string} notificationType - ประเภท เช่น NEW_APPOINTMENT, UPCOMING_REMINDER, MISSED_APPOINTMENT, NEW_REFERRAL
 * @param {string} subject - หัวข้ออีเมล
 * @param {string} htmlContent - เนื้อหาอีเมล (HTML)
 */
async function sendEmailNotification(recipient, notificationType, subject, htmlContent) {
  // 1. บันทึก log สถานะ pending ก่อน
  const [logResult] = await pool.execute(
    `INSERT INTO notifications_log (recipient, notification_type, channel, subject, content, status)
     VALUES (?, ?, 'email', ?, ?, 'pending')`,
    [recipient, notificationType, subject, htmlContent]
  );
  const logId = logResult.insertId;

  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'mom201317@gmail.com';

    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY is not defined in environment variables');
    }

    // 2. ส่งอีเมลผ่าน SendGrid HTTP API
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: recipient }]
          }
        ],
        from: {
          email: fromEmail,
          name: 'ระบบติดตามผู้ป่วย'
        },
        subject: subject,
        content: [
          {
            type: 'text/html',
            value: htmlContent
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`SendGrid API error: ${response.status} - ${errText}`);
    }

    // 3. อัปเดตสถานะเป็น sent
    await pool.execute(
      `UPDATE notifications_log SET status = 'sent', sent_at = NOW() WHERE id = ?`,
      [logId]
    );

    console.log(`✅ SendGrid Email sent to ${recipient} [${notificationType}]`);
    return { success: true, logId };
  } catch (error) {
    // 4. อัปเดตสถานะเป็น failed และเก็บ error message
    const errMsg = error.message || 'Unknown SendGrid error';
    await pool.execute(
      `UPDATE notifications_log SET status = 'failed', error_message = ? WHERE id = ?`,
      [errMsg, logId]
    );

    console.error(`❌ SendGrid Email failed to ${recipient} [${notificationType}]:`, errMsg);
    return { success: false, logId, error: errMsg };
  }
}

// ============================================================
// ฟังก์ชันสร้างเนื้อหาอีเมลสำหรับแต่ละกรณี
// ============================================================

function buildNewAppointmentEmail(patientName, appointmentDate, reason, doctorName) {
  return `
    <div style="font-family: 'IBM Plex Sans Thai', sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #00685f, #009688); padding: 24px; color: white;">
        <h2 style="margin: 0;">📋 แจ้งเตือน: นัดหมายใหม่</h2>
      </div>
      <div style="padding: 24px;">
        <p><strong>ผู้ป่วย:</strong> ${patientName}</p>
        <p><strong>วันนัดหมาย:</strong> ${appointmentDate}</p>
        <p><strong>แพทย์:</strong> ${doctorName || '-'}</p>
        <p><strong>เหตุผล:</strong> ${reason || '-'}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;">
        <p style="color: #666; font-size: 13px;">อีเมลนี้ส่งอัตโนมัติจากระบบติดตามผู้ป่วย กรุณาอย่าตอบกลับ</p>
      </div>
    </div>
  `;
}

function buildUpcomingReminderEmail(patientName, appointmentDate, reason) {
  return `
    <div style="font-family: 'IBM Plex Sans Thai', sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #f57c00, #ff9800); padding: 24px; color: white;">
        <h2 style="margin: 0;">⏰ แจ้งเตือน: นัดหมายภายใน 1 วัน</h2>
      </div>
      <div style="padding: 24px;">
        <p>นัดหมายของผู้ป่วย <strong>${patientName}</strong> กำลังจะถึงในวันพรุ่งนี้</p>
        <p><strong>วันนัดหมาย:</strong> ${appointmentDate}</p>
        <p><strong>เหตุผล:</strong> ${reason || '-'}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;">
        <p style="color: #666; font-size: 13px;">อีเมลนี้ส่งอัตโนมัติจากระบบติดตามผู้ป่วย กรุณาอย่าตอบกลับ</p>
      </div>
    </div>
  `;
}

function buildMissedAppointmentEmail(patientName, appointmentDate, reason) {
  return `
    <div style="font-family: 'IBM Plex Sans Thai', sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #c62828, #e53935); padding: 24px; color: white;">
        <h2 style="margin: 0;">🚨 แจ้งเตือน: ผู้ป่วยไม่มาตามนัด</h2>
      </div>
      <div style="padding: 24px;">
        <p>ผู้ป่วย <strong>${patientName}</strong> ไม่มาตามนัดหมาย</p>
        <p><strong>วันนัดหมาย:</strong> ${appointmentDate}</p>
        <p><strong>เหตุผล:</strong> ${reason || '-'}</p>
        <p style="color: #c62828;"><strong>กรุณาติดต่อผู้ป่วยโดยเร็ว</strong></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;">
        <p style="color: #666; font-size: 13px;">อีเมลนี้ส่งอัตโนมัติจากระบบติดตามผู้ป่วย กรุณาอย่าตอบกลับ</p>
      </div>
    </div>
  `;
}

function buildNewReferralEmail(patientName, fromUnit, toUnit, reason, referralDate) {
  return `
    <div style="font-family: 'IBM Plex Sans Thai', sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1565c0, #1e88e5); padding: 24px; color: white;">
        <h2 style="margin: 0;">🔄 แจ้งเตือน: เคสส่งต่อใหม่</h2>
      </div>
      <div style="padding: 24px;">
        <p>มีผู้ป่วยถูกส่งต่อมายังหน่วยบริการของคุณ</p>
        <p><strong>ผู้ป่วย:</strong> ${patientName}</p>
        <p><strong>จาก:</strong> ${fromUnit}</p>
        <p><strong>ถึง:</strong> ${toUnit}</p>
        <p><strong>วันที่ส่งต่อ:</strong> ${referralDate}</p>
        <p><strong>เหตุผล:</strong> ${reason || '-'}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;">
        <p style="color: #666; font-size: 13px;">อีเมลนี้ส่งอัตโนมัติจากระบบติดตามผู้ป่วย กรุณาอย่าตอบกลับ</p>
      </div>
    </div>
  `;
}

function buildPatientReferralEmail(patientName, fromUnit, toUnit, reason, referralDate) {
  return `
    <div style="font-family: 'IBM Plex Sans Thai', sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #00685f, #00897b); padding: 24px; color: white;">
        <h2 style="margin: 0;">🔄 แจ้งเตือน: รายการส่งต่อของคุณ</h2>
      </div>
      <div style="padding: 24px;">
        <p>เรียน คุณ <strong>${patientName}</strong></p>
        <p>คุณมีรายการส่งต่อรับบริการสุขภาพต่อเนื่อง ดังนี้:</p>
        <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
          <p style="margin: 4px 0;"><strong>จาก:</strong> ${fromUnit}</p>
          <p style="margin: 4px 0;"><strong>ไปยัง:</strong> ${toUnit}</p>
          <p style="margin: 4px 0;"><strong>วันที่ส่งต่อ:</strong> ${referralDate}</p>
          <p style="margin: 4px 0;"><strong>เหตุผล:</strong> ${reason || '-'}</p>
        </div>
        <p>กรุณาเตรียมตัวเข้ารับบริการตามวันและเวลาที่กำหนด หรือรอการติดต่อกลับจากเจ้าหน้าที่หน่วยบริการปลายทาง</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;">
        <p style="color: #666; font-size: 13px;">อีเมลนี้ส่งอัตโนมัติจากระบบติดตามผู้ป่วย กรุณาอย่าตอบกลับ</p>
      </div>
    </div>
  `;
}

function buildReferralStatusEmail(patientName, toUnit, status, rejectReason = '') {
  const isAccepted = status === 'accepted';
  const statusText = isAccepted ? 'ได้รับการตอบรับแล้ว' : 'ถูกปฏิเสธ';
  const color = isAccepted ? '#00685f' : '#c62828';
  const icon = isAccepted ? '✅' : '❌';

  return `
    <div style="font-family: 'IBM Plex Sans Thai', sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
      <div style="background: ${color}; padding: 24px; color: white;">
        <h2 style="margin: 0;">${icon} แจ้งเตือน: สถานะการส่งตัว</h2>
      </div>
      <div style="padding: 24px;">
        <p>รายการส่งตัวผู้ป่วย <strong>${patientName}</strong> ไปยัง <strong>${toUnit}</strong></p>
        <p>สถานะปัจจุบัน: <strong style="color: ${color};">${statusText}</strong></p>
        ${!isAccepted && rejectReason ? `<p><strong>เหตุผลที่ปฏิเสธ:</strong> ${rejectReason}</p>` : ''}
        <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;">
        <p style="color: #666; font-size: 13px;">อีเมลนี้ส่งอัตโนมัติจากระบบติดตามผู้ป่วย กรุณาอย่าตอบกลับ</p>
      </div>
    </div>
  `;
}

module.exports = {
  sendEmailNotification,
  buildNewAppointmentEmail,
  buildUpcomingReminderEmail,
  buildMissedAppointmentEmail,
  buildNewReferralEmail,
  buildPatientReferralEmail,
  buildReferralStatusEmail,
};
