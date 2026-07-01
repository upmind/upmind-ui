import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";
import { useI18n } from "../modules/system-localisation";
import { isNil } from "lodash-es";

dayjs.extend(utc);
dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);

// -----------------------------------------------------------------------------
/**
 * @module utils/useDate
 * @description Locale-aware date formatting. Split out of `useTime` so the
 * latter stays a dependency-free leaf — `useDate` needs `useI18n`, whose
 * `system` barrel pulls the localisation → session-store → query → basket graph
 * and would otherwise drag `useTime` into an import cycle (eager module-load
 * callers like the basket debounce configs then hit `useTime is not a function`).
 */

export type FormattedDate = {
  date?: string | null;
  relative?: string | null;
};

export function useDate(
  timestamp: EpochTimeStamp | string | null | undefined,
  currentTime?: EpochTimeStamp,
  format = useI18n().t("MMM Do, YYYY HH:mm:ss A")
): FormattedDate {
  const { t } = useI18n();
  // Guard against null/undefined inputs using lodash
  if (isNil(timestamp)) return {};

  const now = dayjs(currentTime || new Date());

  const target =
    typeof timestamp === "string"
      ? dayjs.utc(timestamp).local()
      : dayjs(timestamp);

  return {
    date: timestamp ? target.format(format) : null,
    relative:
      target.valueOf() === now.valueOf() ? t("text.now") : target.from(now)
  };
}
