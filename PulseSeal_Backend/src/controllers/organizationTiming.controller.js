import * as organizationTimingServices from '../services/organizationTiming.service.js';
import { successResponse } from '../utils/apiResponse.js';
import moment from 'moment-timezone';

const timezone = "Asia/Kolkata";

const convertShiftsToUTC = (shifts) => {
  return shifts.map(shift => {
    const shiftStartUTC = moment.tz(shift.startTime, "HH:mm", timezone).utc();
    const shiftEndUTC = moment.tz(shift.endTime, "HH:mm", timezone).utc();

    const breaksUTC = (shift.breaks || []).map(b => {
      const breakStartUTC = moment.tz(b.startTime, "HH:mm", timezone).utc();
      const breakEndUTC = moment.tz(b.endTime, "HH:mm", timezone).utc();
      return {
        ...b,
        startTime: breakStartUTC.format("HH:mm"),
        endTime: breakEndUTC.format("HH:mm")
      };
    });

    return {
      ...shift,
      startTime: shiftStartUTC.format("HH:mm"),
      endTime: shiftEndUTC.format("HH:mm"),
      breaks: breaksUTC
    };
  });
};

export const getOfficeTiming = async (req, res) => {
  const organizationId = req.user.organizationId;
  const officeTiming = await organizationTimingServices.getOfficeTiming(organizationId);
  successResponse(res, "Office timing fetched successfully", officeTiming);
};

export const createOfficeTiming = async (req, res) => {
  const organizationId = req.user.organizationId;
  const body = req.body;
  const shiftsInUTC = convertShiftsToUTC(body.shifts || []);
  const data = { organizationId, shifts: shiftsInUTC };
  const officeTiming = await organizationTimingServices.createOfficeTiming(data);
  successResponse(res, "Office timing created successfully", officeTiming);
};

export const updateOfficeTiming = async (req, res) => {
  const organizationId = req.user.organizationId;
  const body = req.body;
  if (body.shifts) body.shifts = convertShiftsToUTC(body.shifts);
  const officeTiming = await organizationTimingServices.updateOfficeTiming(organizationId, body);
  successResponse(res, "Office timing updated successfully", officeTiming);
};
