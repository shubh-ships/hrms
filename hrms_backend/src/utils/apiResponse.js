export const successResponse = (res, message = "Success", data = {}) => {
  return res.status(200).json({
    success: true,
    message,
    data,
  });
};

export const errorResponse = (res, message = "Error", code = 500) => {
  return res.status(code).json({
    success: false,
    message,
  });
};
