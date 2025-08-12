// -----------------------------------------------------------------------------

export function useTime() {
  return {
    IMMEDIATE: 0,
    WAIT: 10, // this allows us to wait for an imperceptible amount of time before continuing
    ERROR: 3000, // this allows us to read the error before continuing,
    POLL: 500, // this allows us to poll every 0.5 seconds
    // ---
    MILLISECOND: 1,
    get SECOND() {
      return 1000 * this.MILLISECOND;
    },
    get MINUTE() {
      return 60 * this.SECOND;
    },
    get HOUR() {
      return 60 * this.MINUTE;
    },
    get DAY() {
      return 24 * this.HOUR;
    },
    get WEEK() {
      return 7 * this.DAY;
    },
    get MONTH() {
      return 30 * this.DAY;
    },
    get YEAR() {
      return 365 * this.DAY;
    }
  };
}

export function useRelativeTime(
  timestamp: EpochTimeStamp,
  currentTime: EpochTimeStamp
) {
  if (timestamp == null || currentTime == null) {
    return null;
  }

  const expiresIn = timestamp - currentTime;

  const seconds = Math.floor(Math.abs(expiresIn) / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const remainingSeconds = seconds % 60;
  const remainingMinutes = minutes % 60;

  const isExpired = !seconds && !minutes && !hours;

  let formattedString = "";

  if (hours > 0) {
    formattedString += `${hours} hour${hours > 1 ? "s" : ""}`;
    if (remainingMinutes > 0 || remainingSeconds > 0) {
      formattedString += " and ";
    }
  }

  if (remainingMinutes > 0) {
    formattedString += `${remainingMinutes} minute${
      remainingMinutes > 1 ? "s" : ""
    }`;
    if (remainingSeconds > 0) {
      formattedString += " and ";
    }
  }

  if (remainingSeconds > 0) {
    formattedString += `${remainingSeconds} second${
      remainingSeconds > 1 ? "s" : ""
    }`;
  }

  return seconds == 0
    ? "now"
    : isExpired
      ? `${formattedString} ago`
      : `in ${formattedString}`;
}
