import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { isNil } from "lodash-es";

dayjs.extend(utc);
dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);

// -----------------------------------------------------------------------------

export function useTime() {
  return {
    IMMEDIATE: 0,
    WAIT: 10, // imperceptible pause before continuing
    INTERACTIVE: 80, // coalesce rapid input from interactive controls (qty steppers, sliders) before reacting
    POLL: 500, // poll every 0.5 seconds
    ERROR: 1000, // give the user time to read an error before continuing
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
  timestamp: EpochTimeStamp | string,
  currentTime?: EpochTimeStamp
): string {
  // Guard against null/undefined inputs using lodash
  if (isNil(timestamp)) return "";
  // if (isNil(currentTime)) return "";

  const now = dayjs(currentTime || new Date());

  const target =
    typeof timestamp === "string"
      ? dayjs.utc(timestamp).local()
      : dayjs(timestamp);

  // If both times are the same, normalise to "now"
  if (target.valueOf() === now.valueOf()) return "now";

  return target.from(now);
}
