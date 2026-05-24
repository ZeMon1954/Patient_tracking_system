const express = require('express');
const router = express.Router();
const rc = require('../controllers/reportController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// รายงานอนุญาตให้ Admin และ Manager เข้าถึงได้หลักๆ แต่เจ้าหน้าที่หน่วยบริการก็ควรดูรายงานของตนเองได้
const allowedReportRoles = ['admin', 'manager', 'hospital_staff', 'pcu_staff'];

router.get('/metadata', authorizeRoles(allowedReportRoles), rc.reportMetadata);
router.get('/1', authorizeRoles(allowedReportRoles), rc.report1Patients);
router.get('/2', authorizeRoles(allowedReportRoles), rc.report2Appointments);
router.get('/3', authorizeRoles(allowedReportRoles), rc.report3Missed);
router.get('/4', authorizeRoles(allowedReportRoles), rc.report4Referrals);
router.get('/5', authorizeRoles(allowedReportRoles), rc.report5Tracking);

module.exports = router;
