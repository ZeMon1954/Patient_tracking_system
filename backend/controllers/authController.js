// ไฟล์: controllers/authController.js
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Secret for JWT (In production, move to .env)
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hospitalis_key';

// 1. ฟังก์ชันเข้าสู่ระบบ (Login)
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'กรุณากรอก username และ password' });
    }

    // 1. Check if user exists (use correct table 'user')
    const [rows] = await pool.execute(
      'SELECT * FROM user WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'username หรือ password ไม่ถูกต้อง' });
    }

    const user = rows[0];

    // 2. Check if password matches
    const isMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'username หรือ password ไม่ถูกต้อง' });
    }

    // 3. Generate JWT Token
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        service_unit_id: user.service_unit_id
      }
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    // 4. Send Response
    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role,
        service_unit_id: user.service_unit_id
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

// 2. ฟังก์ชันตรวจสอบ Token (Get Me)
exports.getMe = async (req, res) => {
  const token = req.header('Authorization')?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'ไม่พบ Token การเข้าถึงถูกปฏิเสธ' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ user: decoded.user });
  } catch (err) {
    res.status(401).json({ message: 'Token ไม่ถูกต้อง หรือหมดอายุ' });
  }
};

// 3. ฟังก์ชันเข้าสู่ระบบผ่าน Google (Google Login)
exports.googleLogin = async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ message: 'ไม่พบ Access Token' });
  }

  try {
    // 1. ตรวจสอบ Access Token กับ Google API
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!googleRes.ok) {
      return res.status(401).json({ message: 'ไม่สามารถตรวจสอบข้อมูลกับ Google ได้ หรือ Access Token หมดอายุ' });
    }

    const googleUser = await googleRes.json();
    const { sub: googleId, email, name } = googleUser;

    if (!email) {
      return res.status(400).json({ message: 'ไม่สามารถดึงข้อมูล Email จาก Google ได้' });
    }

    // 2. ค้นหาใน user_auth_providers ด้วย googleId
    const [providerRows] = await pool.execute(
      'SELECT * FROM user_auth_providers WHERE provider_name = ? AND provider_uid = ?',
      ['google', googleId]
    );

    let user;

    if (providerRows.length > 0) {
      // ดึงข้อมูลผู้ใช้จาก provider record
      const [userRows] = await pool.execute(
        'SELECT * FROM user WHERE id = ?',
        [providerRows[0].user_id]
      );
      if (userRows.length === 0) {
        return res.status(404).json({ message: 'ไม่พบผู้ใช้ในระบบ' });
      }
      user = userRows[0];
    } else {
      // ค้นหาใน user ด้วย email
      const [userRows] = await pool.execute(
        'SELECT * FROM user WHERE email = ?',
        [email]
      );

      if (userRows.length === 0) {
        // หากไม่มี user ในระบบ
        return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าใช้งานระบบ (กรุณาติดต่อผู้ดูแลระบบเพื่อลงทะเบียนอีเมล)' });
      }

      user = userRows[0];

      // บันทึกลิงก์ผู้ใช้กับ Google provider ลงตาราง user_auth_providers
      await pool.execute(
        'INSERT INTO user_auth_providers (user_id, provider_name, provider_uid) VALUES (?, ?, ?)',
        [user.id, 'google', googleId]
      );
    }

    // 3. สร้าง JWT Token
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        service_unit_id: user.service_unit_id
      }
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    // 4. ส่ง Response กลับไปที่ Frontend
    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: {
        id: user.id,
        username: user.username,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role,
        service_unit_id: user.service_unit_id
      },
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};

// 4. ฟังก์ชันดึงข้อมูลโปรไฟล์โดยละเอียด (Get Profile)
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.execute(`
      SELECT u.id, u.username, u.first_name, u.last_name, u.role, u.email,
             u.service_unit_id, u.created_at,
             su.name AS service_unit_name
      FROM user u
      LEFT JOIN service_unit su ON u.service_unit_id = su.id
      WHERE u.id = ?
    `, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้ในระบบ' });
    }

    const user = rows[0];
    res.json({
      id: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      fullName: `${user.first_name} ${user.last_name}`,
      email: user.email,
      role: user.role,
      serviceUnitId: user.service_unit_id,
      serviceUnitName: user.service_unit_name || 'ไม่ระบุหน่วยงาน',
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลส่วนตัว' });
  }
};

// 5. ฟังก์ชันอัปเดตข้อมูลโปรไฟล์ส่วนตัว (Update Profile)
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, email } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อและนามสกุล' });
    }

    // ตรวจสอบอีเมลซ้ำ (ถ้ามีระบุ)
    if (email) {
      const [existingEmail] = await pool.execute(
        'SELECT id FROM user WHERE email = ? AND id != ?',
        [email, userId]
      );
      if (existingEmail.length > 0) {
        return res.status(409).json({ message: 'อีเมลนี้ถูกใช้งานแล้วในระบบ' });
      }
    }

    const [result] = await pool.execute(
      'UPDATE user SET first_name = ?, last_name = ?, email = ? WHERE id = ?',
      [firstName, lastName, email || null, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้งานนี้ในระบบ' });
    }

    res.json({ message: 'อัปเดตโปรไฟล์สำเร็จ' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลโปรไฟล์' });
  }
};

// 6. ฟังก์ชันเปลี่ยนรหัสผ่าน (Change Password)
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่' });
    }

    // ดึงรหัสผ่านปัจจุบันจากฐานข้อมูล
    const [rows] = await pool.execute(
      'SELECT password_hash FROM user WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้ในระบบ' });
    }

    const user = rows[0];

    // ตรวจสอบรหัสผ่านปัจจุบัน
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
    }

    // แฮชรหัสผ่านใหม่และบันทึก
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await pool.execute(
      'UPDATE user SET password_hash = ? WHERE id = ?',
      [newHash, userId]
    );

    res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
  }
};