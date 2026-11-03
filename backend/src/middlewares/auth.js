const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/response');

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, 'Akses ditolak. Token tidak ditemukan.', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_library_locker_2026');
    req.user = decoded;
    next();
  } catch (err) {
    return errorResponse(res, 'Sesi tidak valid atau telah kedaluwarsa. Silakan login kembali.', 401);
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return errorResponse(res, 'Akses terbatas untuk Administrator.', 403);
  }
  next();
}

module.exports = {
  verifyToken,
  requireAdmin
};

