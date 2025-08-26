// Replace your existing errorHandler with this enhanced version
const errorHandler = (err, req, res, next) => {
  console.error('Error Stack:', err.stack);

  // ===== PRISMA ERRORS (NEW) =====
  if (err.code && err.code.startsWith('P')) {
    const prismaErrorMap = {
      P2000: 'Invalid input data provided',
      P2001: 'Record not found',
      P2002: 'A record with this information already exists',
      P2003: 'Invalid reference to related record',
      P2004: 'Database constraint violation',
      P2025: 'Record not found',
      P1001: 'Database connection failed',
      P1008: 'Operation timeout'
    };

    const message = prismaErrorMap[err.code] || 'Database operation failed';
    
    // Determine status code for Prisma errors
    let statusCode = 500;
    if (['P2001', 'P2025'].includes(err.code)) {
      statusCode = 404; // Not found
    } else if (['P2002', 'P2003', 'P2004'].includes(err.code)) {
      statusCode = 400; // Bad request/Conflict
    } else if (['P2000'].includes(err.code)) {
      statusCode = 400; // Bad request
    }

    return res.status(statusCode).json({
      status: 'error',
      message,
      ...(process.env.NODE_ENV === 'development' && { 
        prismaCode: err.code,
        stack: err.stack 
      })
    });
  }

 if (error.code === 'P2002') {
  // Prisma unique constraint error
} else if (error.code === 'P2025') {
  // Prisma record not found error
}

  // ===== JWT ERRORS (EXISTING) =====
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'error',
      message: 'Token expired'
    });
  }

  // ===== EXPRESS-VALIDATOR ERRORS (NEW) =====
  if (err.array && typeof err.array === 'function') {
    // Express-validator errors
    const errors = err.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors
    });
  }

  // ===== CORS ERRORS (NEW) =====
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      status: 'error',
      message: 'Cross-origin request not allowed'
    });
  }

  // ===== RATE LIMIT ERRORS (NEW) =====
  if (err.statusCode === 429) {
    return res.status(429).json({
      status: 'error',
      message: 'Too many requests, please try again later',
      retryAfter: err.retryAfter || 900
    });
  }

  // ===== FILE UPLOAD ERRORS (NEW) =====
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      status: 'error',
      message: 'File too large'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      status: 'error',
      message: 'Unexpected field in file upload'
    });
  }

  // ===== DEFAULT ERROR (EXISTING) =====
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;