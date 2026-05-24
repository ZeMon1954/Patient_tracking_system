const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');

router.get('/', ctrl.getNotifications);
router.get('/unread-count', ctrl.getUnreadCount);
router.put('/read-all', ctrl.markAllAsRead);
router.put('/:id/read', ctrl.markAsRead);
router.post('/', ctrl.createNotification);
router.post('/trigger-check', ctrl.triggerCheck);

module.exports = router;
