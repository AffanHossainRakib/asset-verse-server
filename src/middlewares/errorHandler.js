// Centralized 404 handler — registered after all routes
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

// Centralized error handler — catches errors passed via next(err)
// and uncaught errors from middleware/route handlers
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const statusCode =
    err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err?.message || "Internal server error.",
    ...(process.env.NODE_ENV !== "production" && { stack: err?.stack }),
  });
};

module.exports = { notFoundHandler, errorHandler };
