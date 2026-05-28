# Skill: backend-patterns

## Trigger
เรียกใช้ Skill นี้เมื่อผู้ใช้ถามเกี่ยวกับ:
- การเขียน Controller ใหม่ หรือแก้ไข logic ใน backend
- การเขียน Route ใน Express
- การใช้ Database Transaction
- การ validate request body
- การ handle error และ HTTP status codes
- การเขียน Middleware

## Context

### Standard Controller Pattern
ทุก Controller ใน `backend/controllers/` ควรเขียนตาม pattern นี้:

```javascript
// backend/controllers/exampleController.js
const db = require('../db');

const exampleFunction = async (req, res) => {
  const conn = await db.getConnection();
  try {
    // 1. Validate input
    const { field1, field2 } = req.body;
    if (!field1 || !field2) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    // 2. Business logic
    await conn.beginTransaction();

    const [result] = await conn.query(
      'INSERT INTO table_name (col1, col2) VALUES (?, ?)',
      [field1, field2]
    );

    // หากมีหลาย query ให้ทำใน Transaction เดียวกัน
    await conn.query(
      'UPDATE another_table SET col = ? WHERE id = ?',
      [value, result.insertId]
    );

    await conn.commit();

    // 3. Return response
    res.status(201).json({
      message: 'บันทึกข้อมูลสำเร็จ',
      id: result.insertId
    });

  } catch (err) {
    await conn.rollback();
    console.error('Error in exampleFunction:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  } finally {
    conn.release(); // !! สำคัญมาก: ต้อง release connection เสมอ
  }
};

module.exports = { exampleFunction };
```

### Route Pattern
```javascript
// backend/routes/exampleRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const { exampleFunction } = require('../controllers/exampleController');

// เพิ่ม verifyToken ทุก route ที่ต้องการ auth
router.post('/', verifyToken, authorizeRoles(['hospital_staff', 'admin']), exampleFunction);
router.get('/:id', verifyToken, exampleFunction);

module.exports = router;
```

### Middleware Pattern
```javascript
// ใน index.js — register routes
const exampleRoutes = require('./routes/exampleRoutes');
app.use('/api/example', exampleRoutes);
```

### Auth Middleware Usage
```javascript
// verifyToken — ตรวจสอบ JWT, inject req.user = { id, role, service_unit_id }
// authorizeRoles(['role1', 'role2']) — จำกัดสิทธิ์เฉพาะ role ที่กำหนด

// Roles ที่ใช้ในระบบ:
// 'hospital_staff' — เจ้าหน้าที่โรงพยาบาล
// 'pcu_staff'      — เจ้าหน้าที่อนามัย/รพ.สต.
// 'admin'          — ผู้ดูแลระบบ
// 'manager'        — ผู้จัดการ
```

### HTTP Status Codes ที่ใช้
| Code | ใช้เมื่อ |
|------|---------|
| 200 | GET/PUT สำเร็จ |
| 201 | POST (สร้างข้อมูล) สำเร็จ |
| 400 | Bad Request — ข้อมูลไม่ครบ/รูปแบบผิด |
| 401 | Unauthorized — ไม่มี Token หรือ Token ไม่ถูกต้อง |
| 403 | Forbidden — ไม่มีสิทธิ์ |
| 404 | Not Found — ไม่พบข้อมูล |
| 409 | Conflict — ข้อมูลซ้ำ (เช่น CID ซ้ำ) |
| 500 | Internal Server Error |

### File Upload Pattern (Multer + Supabase)
```javascript
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const storage = multer.memoryStorage(); // เก็บใน memory ก่อน upload
const upload = multer({ storage });

// ใน route: router.post('/', verifyToken, upload.array('images', 5), controller)

// ใน controller:
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const file = req.files[0];
const fileName = `${Date.now()}-${file.originalname}`;
const { data, error } = await supabase.storage
  .from('bucket-name')
  .upload(fileName, file.buffer, { contentType: file.mimetype });

const publicUrl = supabase.storage.from('bucket-name').getPublicUrl(fileName).data.publicUrl;
// จากนั้น INSERT publicUrl ลงตาราง image
```

### Email Notification Pattern
```javascript
// ใช้ nodemailer (configured กับ SendGrid SMTP)
// Services อยู่ใน backend/services/
```

## Files ที่เกี่ยวข้อง
- `backend/db.js` — MySQL connection pool
- `backend/index.js` — Express app + middleware setup
- `backend/middleware/authMiddleware.js` — JWT verify, role authorization
- `backend/controllers/` — ดู controllers เดิมเป็นตัวอย่าง
- `backend/routes/` — ดู routes เดิมเป็นตัวอย่าง
