require('dotenv').config({ path: '../.env' }); // โหลด .env เผื่อรันแยก
const { sendEmailNotification, buildNewAppointmentEmail } = require('../services/notificationService');

async function test() {
  console.log('⏳ กำลังทดสอบส่งอีเมลแจ้งเตือน...');
  
  // ใส่อีเมลของคุณที่จะใช้รับข้อความทดสอบ
  const testRecipient = 'mom201317@gmail.com'; 
  
  const content = buildNewAppointmentEmail(
    'สมชาย ใจดี (ผู้ป่วยทดสอบ)', 
    new Date().toLocaleString('th-TH'), 
    'ตรวจสุขภาพประจำปี', 
    'นพ. ทดสอบ ระบบ'
  );

  const result = await sendEmailNotification(
    testRecipient,
    'NEW_APPOINTMENT',
    'ทดสอบระบบ: การแจ้งเตือนนัดหมายใหม่',
    content
  );

  if (result.success) {
    console.log(`\n🎉 ส่งอีเมลสำเร็จ! ตรวจสอบกล่องจดหมายของ ${testRecipient} ได้เลย`);
    console.log(`(ระบบบันทึกลงฐานข้อมูล notifications_log ด้วย ID: ${result.logId})`);
  } else {
    console.log(`\n❌ ส่งอีเมลไม่สำเร็จ: ${result.error}`);
    console.log('กรุณาตรวจสอบ SMTP_USER และ SMTP_PASS ในไฟล์ .env ว่าถูกต้องหรือไม่');
  }
  
  process.exit(0);
}

test();
