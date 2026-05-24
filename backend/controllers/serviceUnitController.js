// ไฟล์: controllers/serviceUnitController.js
const db = require('../db')

// 1. ดึงข้อมูลทั้งหมด (GET)
exports.getAllServiceUnits = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM service_unit ORDER BY id DESC')
    
    const formattedData = rows.map(row => ({
      code: row.unit_code,
      nameTh: row.name,
      type: row.type || 'Hospital',
      address: row.address || '',
      province: row.province || '',
      district: row.district || '',
      subDistrict: row.sub_district || '', // ดึงตำบลเพิ่มเข้ามา
      phone: row.phone || '',
      status: row.status || 'Active'
    }))
    
    res.status(200).json(formattedData)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลหน่วยบริการ' })
  }
}

// 2. เพิ่มข้อมูลใหม่ (POST)
exports.createServiceUnit = async (req, res) => {
  const { nameTh, type, address, province, district, subDistrict, phone, status } = req.body

  if (!nameTh) {
    return res.status(400).json({ message: 'กรุณากรอกชื่อหน่วยบริการ' })
  }

  try {
    // ดึงรหัสล่าสุดเพื่อมารันต่อ (Auto-generate)
    // ใช้รูปแบบ: 1XXXX สำหรับ Hospital, 2XXXX สำหรับ Health Center, 3XXXX สำหรับอื่นๆ
    let prefix = '9'; // Default
    if (type === 'Hospital') prefix = '1';
    else if (type === 'Health Center' || type === 'Clinic') prefix = '2';

    const [lastUnit] = await db.query(
      "SELECT unit_code FROM service_unit WHERE unit_code LIKE ? ORDER BY unit_code DESC LIMIT 1",
      [`${prefix}%`]
    );

    let nextNum = 1;
    if (lastUnit.length > 0) {
      const lastCode = lastUnit[0].unit_code;
      const currentNum = parseInt(lastCode.substring(1));
      if (!isNaN(currentNum)) {
        nextNum = currentNum + 1;
      }
    }

    const code = `${prefix}${nextNum.toString().padStart(4, '0')}`;

    const [result] = await db.query(
      `INSERT INTO service_unit 
      (unit_code, name, type, address, province, district, sub_district, phone, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, nameTh, type, address, province, district, subDistrict, phone, status || 'Active']
    )

    res.status(201).json({ message: 'บันทึกข้อมูลสำเร็จ', code, nameTh })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'รหัสหน่วยบริการนี้มีอยู่แล้ว' })
    }
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' })
  }
}

// 3. แก้ไขข้อมูล (PUT)
exports.updateServiceUnit = async (req, res) => {
  const { code } = req.params
  const { nameTh, type, address, province, district, subDistrict, phone, status } = req.body

  try {
    const [result] = await db.query(
      `UPDATE service_unit 
       SET name=?, type=?, address=?, province=?, district=?, sub_district=?, phone=?, status=? 
       WHERE unit_code=?`,
      [nameTh, type, address, province, district, subDistrict, phone, status, code]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบรหัสหน่วยบริการนี้ในระบบ' })
    }

    res.status(200).json({ message: 'อัปเดตข้อมูลสำเร็จ' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' })
  }
}

// 4. ลบข้อมูล (DELETE)
exports.deleteServiceUnit = async (req, res) => {
  const { code } = req.params;

  try {
    const [result] = await db.query('DELETE FROM service_unit WHERE unit_code = ?', [code]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบรหัสหน่วยบริการนี้ หรือถูกลบไปแล้ว' });
    }

    res.status(200).json({ message: 'ลบข้อมูลสำเร็จ' });
  } catch (err) {
    console.error('Delete Error:', err);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
  }
}