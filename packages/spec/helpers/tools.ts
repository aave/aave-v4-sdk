import { TimeWindow } from '@aave/client';

export function getTimeWindowDates(timeWindow: TimeWindow): {
  now: Date;
  startDate: Date;
} {
  const now = new Date();
  // Round down to start of current hour in UTC to account for data points being at whole hours
  const nowRounded = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      0,
      0,
      0,
    ),
  );

  const startDate =
    timeWindow === TimeWindow.LastDay
      ? new Date(
          Date.UTC(
            nowRounded.getUTCFullYear(),
            nowRounded.getUTCMonth(),
            nowRounded.getUTCDate() - 1,
            0,
            0,
            0,
            0,
          ),
        )
      : timeWindow === TimeWindow.LastWeek
        ? new Date(
            Date.UTC(
              nowRounded.getUTCFullYear(),
              nowRounded.getUTCMonth(),
              nowRounded.getUTCDate() - 8,
              0,
              0,
              0,
              0,
            ),
          )
        : timeWindow === TimeWindow.LastMonth
          ? new Date(
              Date.UTC(
                nowRounded.getUTCFullYear(),
                nowRounded.getUTCMonth() - 1,
                nowRounded.getUTCDate() - 2,
                0,
                0,
                0,
                0,
              ),
            )
          : timeWindow === TimeWindow.LastSixMonths
            ? new Date(
                Date.UTC(
                  nowRounded.getUTCFullYear(),
                  nowRounded.getUTCMonth() - 6,
                  nowRounded.getUTCDate() - 2,
                  0,
                  0,
                  0,
                  0,
                ),
              )
            : timeWindow === TimeWindow.LastYear
              ? new Date(
                  Date.UTC(
                    nowRounded.getUTCFullYear() - 1,
                    nowRounded.getUTCMonth(),
                    nowRounded.getUTCDate() - 2,
                    0,
                    0,
                    0,
                    0,
                  ),
                )
              : new Date(
                  Date.UTC(
                    nowRounded.getUTCFullYear() - 10,
                    nowRounded.getUTCMonth(),
                    nowRounded.getUTCDate() - 2,
                    0,
                    0,
                    0,
                    0,
                  ),
                );

  return {
    now: nowRounded,
    startDate,
  };
}
