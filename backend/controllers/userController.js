// ไฟล์: controllers/userController.js
const db = require('../db');
const bcrypt = require('bcryptjs');

// Role mapping สำหรับแสดงผลภาษาไทย
const ROLE_LABELS = {
  admin: 'ผู้ดูแลระบบ',
  manager: 'ผู้บริหาร',
  hospital_staff: 'เจ้าหน้าที่ รพ.',
  pcu_staff: 'เจ้าหน้าที่ รพ.สต.',
};

// 1. ดึงข้อมูลผู้ใช้ทั้งหมด (GET)
exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id, u.username, u.first_name, u.last_name, u.role, u.email,
             u.service_unit_id, u.created_at,
             su.name AS service_unit_name
      FROM user u
      LEFT JOIN service_unit su ON u.service_unit_id = su.id
      ORDER BY u.id DESC
    `);

    const formatted = rows.map(row => ({
      id: row.id,
      username: row.username,
      firstName: row.first_name,
      lastName: row.last_name,
      fullName: `${row.first_name} ${row.last_name}`,
      email: row.email,
      role: row.role,
      roleLabel: ROLE_LABELS[row.role] || row.role,
      serviceUnitId: row.service_unit_id,
      serviceUnitName: row.service_unit_name || '-',
      createdAt: row.created_at,
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error('getAllUsers error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้งาน' });
  }
};

// 2. เพิ่มผู้ใช้ใหม่ (POST)
exports.createUser = async (req, res) => {
  const { username, password, firstName, lastName, role, serviceUnitId, email } = req.body;

  if (!username || !password || !firstName || !lastName || !role) {
    return res.status(400).json({
      message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อ, นามสกุล, ชื่อผู้ใช้, รหัสผ่าน, บทบาท)',
    });
  }

  try {
    // ตรวจสอบว่า username ซ้ำหรือไม่
    const [existingUser] = await db.query('SELECT id FROM user WHERE username = ?', [username]);
    if (existingUser.length > 0) {
      return res.status(409).json({ message: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' });
    }

    // ตรวจสอบว่า email ซ้ำหรือไม่ (ถ้ามีการระบุมา)
    if (email) {
      const [existingEmail] = await db.query('SELECT id FROM user WHERE email = ?', [email]);
      if (existingEmail.length > 0) {
        return res.status(409).json({ message: 'อีเมลนี้ถูกใช้งานแล้วในระบบ' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO user (username, password_hash, first_name, last_name, role, service_unit_id, email)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, passwordHash, firstName, lastName, role, serviceUnitId || null, email || null]
    );

    res.status(201).json({ message: 'เพิ่มผู้ใช้งานสำเร็จ', id: result.insertId });
  } catch (err) {
    console.error('createUser error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเพิ่มผู้ใช้งาน' });
  }
};

// 3. แก้ไขข้อมูลผู้ใช้ (PUT)
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, password, firstName, lastName, role, serviceUnitId, email } = req.body;

  if (!username || !firstName || !lastName || !role) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
  }

  try {
    // ตรวจสอบว่า username ซ้ำกับคนอื่นหรือไม่
    const [existingUser] = await db.query('SELECT id FROM user WHERE username = ? AND id != ?', [username, id]);
    if (existingUser.length > 0) {
      return res.status(409).json({ message: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' });
    }

    // ตรวจสอบว่า email ซ้ำกับคนอื่นหรือไม่ (ถ้ามีการระบุมา)
    if (email) {
      const [existingEmail] = await db.query('SELECT id FROM user WHERE email = ? AND id != ?', [email, id]);
      if (existingEmail.length > 0) {
        return res.status(409).json({ message: 'อีเมลนี้ถูกใช้งานแล้วในระบบ' });
      }
    }

    let query;
    let params;

    if (password && password.trim() !== '') {
      const passwordHash = await bcrypt.hash(password, 10);
      query = `UPDATE user SET username=?, password_hash=?, first_name=?, last_name=?, role=?, service_unit_id=?, email=? WHERE id=?`;
      params = [username, passwordHash, firstName, lastName, role, serviceUnitId || null, email || null, id];
    } else {
      query = `UPDATE user SET username=?, first_name=?, last_name=?, role=?, service_unit_id=?, email=? WHERE id=?`;
      params = [username, firstName, lastName, role, serviceUnitId || null, email || null, id];
    }

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้งานนี้ในระบบ' });
    }

    res.status(200).json({ message: 'อัปเดตข้อมูลผู้ใช้งานสำเร็จ' });
  } catch (err) {
    console.error('updateUser error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
  }
};

// 4. ลบผู้ใช้งาน (DELETE)
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM user WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้งานนี้ หรือถูกลบไปแล้ว' });
    }

    res.status(200).json({ message: 'ลบผู้ใช้งานสำเร็จ' });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบผู้ใช้งาน' });
  }
};
