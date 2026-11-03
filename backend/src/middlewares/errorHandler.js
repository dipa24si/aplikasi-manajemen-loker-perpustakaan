const { errorResponse } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error('[Error]:', err.stack || err.message);

  if (err.name === 'ValidationError') {
    return errorResponse(res, err.message, 400);
  }

  // Handle MySQL Duplicate Entry
  if (err.code === 'ER_DUP_ENTRY') {
    return errorResponse(res, 'Data duplikat terdeteksi dalam sistem.', 409);
  }

  return errorResponse(
    res,
    process.env.NODE_ENV === 'production' 
      ? 'Terjadi kesalahan pada server.' 
      : err.message || 'Terjadi kesalahan internal server.',
    500
  );
}

module.exports = errorHandler;

