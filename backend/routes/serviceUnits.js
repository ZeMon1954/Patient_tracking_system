// ไฟล์: routes/serviceUnits.js
const express = require('express')
const router = express.Router()

// นำเข้า Controller ที่เราแยกไว้
const serviceUnitController = require('../controllers/serviceUnitController')
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// กำหนดเส้นทาง (Routes) ชี้ไปที่ฟังก์ชันใน Controller
router.get('/', authorizeRoles(['admin', 'manager', 'hospital_staff', 'pcu_staff']), serviceUnitController.getAllServiceUnits)
router.post('/', authorizeRoles(['admin']), serviceUnitController.createServiceUnit)
router.put('/:code', authorizeRoles(['admin']), serviceUnitController.updateServiceUnit)
router.delete('/:code', authorizeRoles(['admin']), serviceUnitController.deleteServiceUnit)

module.exports = router