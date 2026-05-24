const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const db = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);
router.use(authorizeRoles(['admin']));

// GET /api/users/service-units
router.get('/service-units', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name FROM service_unit ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
});

// GET    /api/users         - ดึงผู้ใช้ทั้งหมด
// POST   /api/users         - เพิ่มผู้ใช้ใหม่
// PUT    /api/users/:id     - แก้ไขผู้ใช้
// DELETE /api/users/:id     - ลบผู้ใช้

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;

