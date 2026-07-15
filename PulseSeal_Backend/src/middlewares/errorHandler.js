import ApiError from '../utils/apiError.js';

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

    if (!(err instanceof ApiError)) {
    err = new ApiError(500, 'Internal Server Error');
  }

  console.log(err.statusCode)

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorHandler;
