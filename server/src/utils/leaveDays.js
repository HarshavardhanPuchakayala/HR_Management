const normalizeUtcDate = (value) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    )
  );
};

export const calculateLeaveDays = (
  startDate,
  endDate
) => {
  const start = normalizeUtcDate(
    startDate
  );
  const end = normalizeUtcDate(
    endDate
  );

  if (end < start) {
    throw new Error(
      "End date cannot be before start date"
    );
  }

  const millisecondsPerDay =
    24 * 60 * 60 * 1000;

  return (
    Math.floor(
      (end.getTime() - start.getTime()) /
        millisecondsPerDay
    ) + 1
  );
};

export const getLeaveCycleYear = (
  startDate
) => {
  return normalizeUtcDate(
    startDate
  ).getUTCFullYear();
};

export default calculateLeaveDays;