// routes/referrals.js
const express = require('express');
const router = express.Router();
const rc = require('../controllers/referralController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/inbox', authorizeRoles(['admin', 'hospital_staff', 'pcu_staff', 'manager']), rc.getInbox);
router.post('/', authorizeRoles(['admin', 'hospital_staff']), rc.createReferral);
router.put('/:id/status', authorizeRoles(['admin', 'pcu_staff']), rc.updateStatus);

module.exports = router;
