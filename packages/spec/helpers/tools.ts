import { TimeWindow } from '@aave/client';

function createUTCDate(year: number, month: number, date: number): Date {
  return new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
}

export function getTimeWindowDates(timeWindow: TimeWindow): {
  now: Date;
  startDate: Date;
} {
  const now = new Date();
  // Round down to start of current hour in UTC to account for data points being at whole hours
  const nowRounded = createUTCDate(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  const year = nowRounded.getUTCFullYear();
  const month = nowRounded.getUTCMonth();
  const date = nowRounded.getUTCDate();

  let startDate: Date;

  switch (timeWindow) {
    case TimeWindow.LastDay:
      startDate = createUTCDate(year, month, date - 1);
      break;
    case TimeWindow.LastWeek:
      startDate = createUTCDate(year, month, date - 8);
      break;
    case TimeWindow.LastMonth:
      startDate = createUTCDate(year, month - 1, date - 2);
      break;
    case TimeWindow.LastSixMonths:
      startDate = createUTCDate(year, month - 6, date - 2);
      break;
    case TimeWindow.LastYear:
      startDate = createUTCDate(year - 1, month, date - 2);
      break;
    default:
      startDate = createUTCDate(year - 10, month, date - 2);
      break;
  }

  return {
    now: nowRounded,
    startDate,
  };
}
