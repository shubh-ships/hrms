import moment from 'moment-timezone';

export const getUTCMidnight = (dateString, timezone) => {
  // dateString: YYYY-MM-DD
  // timezone: e.g., 'Asia/Kolkata'
  return moment.tz(dateString, 'YYYY-MM-DD', timezone).startOf('day').utc().toDate();
};

export const getDateRangeForMonth = (year, month, timezone) => {
  const start = moment.tz({ year, month: month - 1, day: 1 }, timezone).startOf('day').utc().toDate();
  const end = moment.tz(start, timezone).endOf('month').utc().toDate();
  return { start, end };
};

export const formatDateToLocal = (date, timezone) => {
  return moment.tz(date, timezone).format('YYYY-MM-DD');
};