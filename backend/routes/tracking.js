const express = require('express');
const router = express.Router();
const tc = require('../controllers/trackingController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer Storage Configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(authenticateToken);

router.post('/', authorizeRoles(['admin', 'pcu_staff']), upload.array('images', 5), tc.createTracking);
router.get('/pcu/:unit_id', authorizeRoles(['admin', 'pcu_staff', 'manager']), tc.getPCUPatients);
router.get('/pcu/:unit_id/today-appointments', authorizeRoles(['admin', 'pcu_staff', 'manager']), tc.getTodayAppointments);
router.get('/pcu/:unit_id/missed-appointments', authorizeRoles(['admin', 'pcu_staff', 'manager']), tc.getMissedAppointments);
router.get('/patient/:patient_id', tc.getTrackingHistory);
router.get('/:id/attachments', tc.getTrackingAttachments);

module.exports = router;
