const express = require('express');
const router = express.Router();
const dc = require('../controllers/dashboardController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/summary', authorizeRoles(['admin', 'manager', 'hospital_staff', 'pcu_staff']), dc.getDashboardSummary);
router.get('/stats/disease', authorizeRoles(['admin', 'manager']), dc.getDiseaseStats);
router.get('/stats/appointments', authorizeRoles(['admin', 'manager']), dc.getAppointmentStats);
router.get('/stats/referrals', authorizeRoles(['admin', 'manager']), dc.getReferralStats);

module.exports = router;
