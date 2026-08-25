function errorHandler(err, req, res, next) {
  console.error('Server error:', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Đã có lỗi xảy ra từ phía máy chủ',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

module.exports = errorHandler;
