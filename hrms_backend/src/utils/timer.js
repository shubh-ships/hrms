export function getCountdownDetails(TATMinutes, timerStartTime) {
  if (!TATMinutes) {
    throw new Error('TAT (Turnaround Time) is required');
  }

  const totalMs = TATMinutes * 60 * 1000;

  if (!timerStartTime) {
    return {
      started: false,
      rawSeconds: -Math.floor(totalMs / 1000),
      remaining: {
        hours: 0,
        minutes: TATMinutes,
        seconds: 0
      },
      expired: false
    };
  }

  const now = new Date();
  const startTime = new Date(timerStartTime);
  const endTime = new Date(startTime.getTime() + totalMs);
  const diffMs = endTime - now;
  const rawSeconds = Math.floor(diffMs / 1000);

  const abs = Math.abs(rawSeconds);
  const hours = Math.floor(abs / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  const seconds = abs % 60;

  return {
    started: true,
    rawSeconds,
    remaining: { hours, minutes, seconds },
    expired: rawSeconds <= 0,
    startTime,
    endTime
  };
}


export function calculateETAT(timerStartTime, TATMinutes, submittedAt = new Date()) {
    if (!timerStartTime || !TATMinutes) return 0;
    
    const allowedTimeMs = TATMinutes * 60 * 1000;
    const elapsedTimeMs = new Date(submittedAt) - new Date(timerStartTime);

  const extraMs = elapsedTimeMs - allowedTimeMs;
  return extraMs > 0 ? Math.ceil(extraMs / (60 * 1000)) : 0;
}