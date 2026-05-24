// ไฟล์: routes/auth.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');

// นำเข้า Controller สำหรับจัดการการล็อกอิน
const authController = require('../controllers/authController');

// กำหนดเส้นทาง (Routes) ชี้ไปที่ฟังก์ชันใน Controller
router.post('/login', authController.login);
router.post('/google-login', authController.googleLogin);
router.get('/me', authController.getMe);

// เส้นทางสำหรับจัดการโปรไฟล์และการตั้งค่าความปลอดภัย
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, authController.updateProfile);
router.put('/change-password', authenticateToken, authController.changePassword);

module.exports = router;