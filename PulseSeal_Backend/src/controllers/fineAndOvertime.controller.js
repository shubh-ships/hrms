import fineAndOvertimeService from "../services/fineAndOvertime.service.js";

/**
 * CREATE FINE
 */
export const createFine = async (req, res, next) => {
  try {
    const result = await fineAndOvertimeService.createFine(req.body);

    res.status(201).json({
      success: true,
      message: "Fine created (PENDING)",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CREATE OVERTIME
 */
export const createOvertime = async (req, res, next) => {
  try {
    const result = await fineAndOvertimeService.createOvertime(req.body);

    res.status(201).json({
      success: true,
      message: "Overtime created (PENDING)",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * HANDLE ACTION
 */
export const handleAction = async (req, res, next) => {
  try {
    const { attendanceId, type, itemId, action, data } = req.body;

    if (!attendanceId || !type || !itemId || !action) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const result = await fineAndOvertimeService.handleAction({
      attendanceId,
      type,
      itemId,
      action,
      data,
      user: req.user,
    });

    res.status(200).json({
      success: true,
      message: `${type} ${action} successful`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};