import asyncHandler from "../middlewares/asyncHandler.js";
import ApiError from "../utils/apiError.js";
import * as celebrationService from "../services/celebration.service.js";

/**
 * Helper to parse date from query string (YYYY-MM-DD) into a Date object (UTC)
 */
export const parseDateParam = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

/**
 * GET /api/employees/birthdays?organizationId=xxx&startDate=2026-02-04&endDate=2026-02-11
 * Returns list of employees with birthdays in the given range (default: today to month-end).
 */
export const getBirthdayList = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;
  const { startDate, endDate } = req.query;
  if (!organizationId) {
    throw new ApiError(400, "Organization ID is required");
  }

  let start = parseDateParam(startDate);
  let end = parseDateParam(endDate);

  // If both are provided, validate they are dates and start <= end
  if (startDate || endDate) {
    if (!start || !end) {
      throw new ApiError(
        400,
        "Both startDate and endDate must be valid dates (YYYY-MM-DD)",
      );
    }
    if (start > end) {
      throw new ApiError(400, "startDate must be before or equal to endDate");
    }
  }

  const result = await celebrationService.getBirthdayList(
    organizationId,
    start,
    end,
  );
  res.status(200).json({ success: true, data: result });
});

/**
 * GET /api/employees/anniversaries?organizationId=xxx&startDate=2026-02-04&endDate=2026-02-11
 * Returns list of employees with work anniversaries in the given range.
 */
export const getAnniversaryList = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;
  const { startDate, endDate } = req.query;
  if (!organizationId) {
    throw new ApiError(400, "Organization ID is required");
  }

  let start = parseDateParam(startDate);
  let end = parseDateParam(endDate);

  if (startDate || endDate) {
    if (!start || !end) {
      throw new ApiError(
        400,
        "Both startDate and endDate must be valid dates (YYYY-MM-DD)",
      );
    }
    if (start > end) {
      throw new ApiError(400, "startDate must be before or equal to endDate");
    }
  }

  const result = await celebrationService.getAnniversaryList(
    organizationId,
    start,
    end,
  );
  res.status(200).json({ success: true, data: result });
});
