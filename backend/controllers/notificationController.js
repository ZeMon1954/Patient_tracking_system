// controllers/notificationController.js
const db = require('../db');

const { runDailyCheck } = require('../services/cronJobs');

// GET /api/notifications - ดึงรายการแจ้งเตือนของผู้ใช้
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ message: 'กรุณาระบุ user_id' });

    const [rows] = await db.query(
      'SELECT * FROM notification_system WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('getNotifications:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// GET /api/notifications/unread-count - นับจำนวนที่ยังไม่อ่าน
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ message: 'กรุณาระบุ user_id' });

    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM notification_system WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    res.json({ count: rows[0].count });
  } catch (err) {
    console.error('getUnreadCount:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// PUT /api/notifications/:id/read - อ่านแจ้งเตือน (mark as read)
exports.markAsRead = async (req, res) => {
  try {
    await db.query(
      'UPDATE notification_system SET is_read = 1 WHERE id = ?',
      [req.params.id]
    );
    res.json({ message: 'อ่านแจ้งเตือนแล้ว' });
  } catch (err) {
    console.error('markAsRead:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// PUT /api/notifications/read-all - อ่านทั้งหมด
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.body.user_id;
    if (!userId) return res.status(400).json({ message: 'กรุณาระบุ user_id' });

    await db.query(
      'UPDATE notification_system SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    res.json({ message: 'อ่านทั้งหมดแล้ว' });
  } catch (err) {
    console.error('markAllAsRead:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// POST /api/notifications - สร้างแจ้งเตือนใหม่ (ใช้ภายใน)
exports.createNotification = async (req, res) => {
  try {
    const { user_id, title, message } = req.body;
    if (!user_id || !title) return res.status(400).json({ message: 'กรุณาระบุ user_id และ title' });

    const [result] = await db.query(
      'INSERT INTO notification_system (user_id, title, message, is_read) VALUES (?,?,?,0)',
      [user_id, title, message || null]
    );
    res.status(201).json({ message: 'สร้างแจ้งเตือนสำเร็จ', id: result.insertId });
  } catch (err) {
    console.error('createNotification:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// POST /api/notifications/trigger-check - สั่งรันการตรวจสอบขาดนัดด้วยมือ (สำหรับเทสผ่านหน้าเว็บ)
exports.triggerCheck = async (req, res) => {
  try {
    const stats = await runDailyCheck();
    res.json({ 
      message: 'รันระบบตรวจสอบสำเร็จ', 
      processed_upcoming: stats.upcoming,
      processed_missed: stats.missed
    });
  } catch (err) {
    console.error('triggerCheck error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการรันระบบ' });
  }
};
