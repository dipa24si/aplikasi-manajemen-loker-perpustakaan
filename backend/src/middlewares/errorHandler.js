const { errorResponse } = require('../utils/response');

function errorHandler(err, req, res, next) {
  // Log error lengkap di terminal/server console (hanya internal developer/admin server)
  console.error('[Internal Error]:', err.stack || err.message);

  if (err.name === 'ValidationError') {
    return errorResponse(res, err.message, 400);
  }

  // Handle MySQL Duplicate Entry
  if (err.code === 'ER_DUP_ENTRY') {
    return errorResponse(res, 'Data duplikat terdeteksi dalam sistem.', 409);
  }

  // Handle MySQL Data Too Long
  if (err.code === 'ER_DATA_TOO_LONG') {
    return errorResponse(res, 'Panjang data input melebihi batas yang diizinkan sistem.', 400);
  }

  // Handle MySQL Connection Failure / Server Mati / Jaringan Terputus
  const isDbConnectionError = 
    err.code === 'ECONNREFUSED' ||
    err.code === 'ETIMEDOUT' ||
    err.code === 'ENOTFOUND' ||
    err.code === 'EHOSTUNREACH' ||
    err.code === 'ENETUNREACH' ||
    err.code === 'ECONNRESET' ||
    err.code === 'PROTOCOL_CONNECTION_LOST' ||
    err.code === 'ER_ACCESS_DENIED_ERROR' ||
    err.code === 'ER_DBACCESS_DENIED_ERROR' ||
    err.code === 'ER_CON_COUNT_ERROR' ||
    /ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH|ENOTFOUND/i.test(err.message || '');

  if (isDbConnectionError) {
    return errorResponse(
      res,
      'Koneksi ke server database terputus atau tidak dapat dijangkau. Silakan hubungi administrator.',
      503
    );
  }

  // Handle MySQL Database / Query Error (jangan bocorkan nama tabel/kolom/syntax SQL)
  if (err.code && (err.code.startsWith('ER_') || err.code.startsWith('PROTOCOL_'))) {
    return errorResponse(
      res,
      'Terjadi kendala pada pemrosesan database. Silakan coba beberapa saat lagi.',
      500
    );
  }

  // Filter pengaman jika ada IP address atau port yang bocor di pesan error
  const rawMessage = err.message || '';
  if (/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?\b/.test(rawMessage)) {
    return errorResponse(
      res,
      'Koneksi ke server database terputus atau tidak dapat dijangkau. Silakan hubungi administrator.',
      500
    );
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

