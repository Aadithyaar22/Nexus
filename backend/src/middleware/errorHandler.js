export const errorHandler = (err, _req, res, _next) => {
  console.error('[error]', err.message);
  if (process.env.NODE_ENV !== 'production') console.error(err.stack);

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};

// Convenience wrapper so controllers can throw without try/catch noise
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
