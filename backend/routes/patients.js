// routes/patients.js
const express = require('express');
const router = express.Router();
const pc = require('../controllers/patientController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// ทุก Route ในนี้ต้องผ่านการตรวจสอบ Token
router.use(authenticateToken);

// Lookup routes
router.get('/service-units', pc.getServiceUnits);
router.get('/doctors', pc.getDoctors);
router.get('/diseases', pc.getDiseases);
router.post('/diseases', authorizeRoles(['admin', 'hospital_staff']), pc.createDisease);

// Patient CRUD
router.get('/', authorizeRoles(['admin', 'hospital_staff', 'pcu_staff', 'manager']), pc.getPatients);
router.get('/:id', authorizeRoles(['admin', 'hospital_staff', 'pcu_staff', 'manager']), pc.getPatientById);
router.post('/', authorizeRoles(['admin', 'hospital_staff', 'pcu_staff']), pc.createPatient);
router.put('/:id', authorizeRoles(['admin', 'hospital_staff', 'pcu_staff']), pc.updatePatient);
router.delete('/:id', authorizeRoles(['admin', 'hospital_staff']), pc.deletePatient);

// Appointment sub-routes
router.get('/:id/appointments', authorizeRoles(['admin', 'hospital_staff', 'pcu_staff', 'manager']), pc.getAppointments);
router.post('/:id/appointments', authorizeRoles(['admin', 'hospital_staff', 'pcu_staff']), pc.createAppointment);
router.put('/:id/appointments/:apptId', authorizeRoles(['admin', 'hospital_staff', 'pcu_staff']), pc.updateAppointment);
router.delete('/:id/appointments/:apptId', authorizeRoles(['admin', 'hospital_staff']), pc.deleteAppointment);

module.exports = router;
