/**
 * Format standard success response
 */
function successResponse(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

/**
 * Format standard error response
 * Melindungi dari kebocoran IP server, port, dan error teknis database
 */
function errorResponse(res, message = 'An error occurred', statusCode = 500, errors = null) {
  let safeMessage = message;

  if (typeof safeMessage === 'string') {
    // Sembunyikan jika ada IP address atau port internal server
    const hasIpAddress = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?\b/.test(safeMessage);
    const isDbRefused = /ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH|ENOTFOUND|ECONNRESET|PROTOCOL_CONNECTION_LOST/i.test(safeMessage);

    if (hasIpAddress || isDbRefused) {
      safeMessage = 'Koneksi ke server database terputus atau tidak dapat dijangkau. Silakan hubungi administrator.';
      if (statusCode === 500) {
        statusCode = 503;
      }
    }
  }

  const payload = {
    success: false,
    message: safeMessage
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
}

module.exports = {
  successResponse,
  errorResponse
};

