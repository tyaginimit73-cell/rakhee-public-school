export const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Centralized error handler — consistent JSON, no stack traces in production
export const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';

  // express.json() throws a SyntaxError (type 'entity.parse.failed') on
  // malformed request bodies. It carries no statusCode, so without this
  // check it fell through to the generic 500 branch below instead of a 400.
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && 'body' in err)) {
    status = 400; message = 'Malformed JSON in request body';
  }
  if (err.name === 'CastError') { status = 400; message = 'Invalid identifier format'; }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') { status = 401; message = 'Session invalid or expired, please sign in again'; }
  if (err.code === 11000) { status = 409; message = `A record with this ${Object.keys(err.keyValue || {}).join(', ') || 'value'} already exists`; }
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map((e) => e.message).join(', '); }
  if (err.name === 'MulterError') { status = 400; message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 5 MB)' : err.message; }
  if (typeof err.message === 'string' && err.message.includes('not allowed by CORS')) { status = 403; }

  if (status >= 500) console.error('💥', err);
  res.status(status).json({
    success: false,
    message,
    ...(err.errors ? { errors: err.errors } : {}),
    ...(process.env.NODE_ENV !== 'production' && status >= 500 ? { stack: err.stack } : {}),
  });
};
