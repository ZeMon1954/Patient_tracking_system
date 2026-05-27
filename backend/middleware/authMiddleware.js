const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hospitalis_key';

// 1. Middleware ตรวจสอบ Token ทั่วไป
const authenticateToken = (req, res, next) => {
  console.log(`[Auth Log] Incoming Request: ${req.method} ${req.originalUrl}`);
  console.log('[Auth Log] Headers received:', JSON.stringify(req.headers));

  const authHeader = req.headers['authorization'];
  console.log('[Auth Log] authorization header:', authHeader);

  const token = authHeader && authHeader.split(' ')[1];
  console.log('[Auth Log] Extracted token:', token);

  if (!token) {
    console.log('[Auth Log] No token found. Access denied.');
    return res.status(401).json({ message: 'ไม่พบ Token การเข้าถึงถูกปฏิเสธ' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('[Auth Log] Token verification failed:', err.message);
      return res.status(403).json({ message: 'Token ไม่ถูกต้อง หรือหมดอายุ' });
    }
    console.log('[Auth Log] Token verified successfully for user:', decoded.user.username);
    req.user = decoded.user;
    next();
  });
};

// 2. Middleware ตรวจสอบ Role (RBAC)
// roles: array ของ role ที่อนุญาต เช่น ['admin', 'hospital_staff']
const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
    }

    const userRole = req.user.role ? req.user.role.toLowerCase() : '';
    
    if (!allowedRoles.map(r => r.toLowerCase()).includes(userRole)) {
      console.warn(`[Auth] Access Denied: User ${req.user.username} (Role: ${req.user.role}) tried to access ${req.originalUrl}. Allowed: ${allowedRoles.join(',')}`);
      return res.status(403).json({ 
        message: `คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ (ต้องการสิทธิ์: ${allowedRoles.join(' หรือ ')})` 
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};
