// --- external

// --- internal

// --- utils
import {
  defaultsDeep,
  forEach,
  isEmpty,
  isEqual,
  keyBy,
  set,
  reduce,
  pick,
} from "lodash-es";
import { useCookies } from ".";

// --- Types
const UPM_TRACK_KEYS = ["source", "medium", "campaign", "content", "term"];
const UPM_TRACK_COOKIE = "upm_track";

interface IUpmState {
  track: {
    source: string;
    medium: string;
    campaign: string;
    content: string;
    term: string;
  } | null;
}
// -----------------------------------------------------------------------------

export const useTracking = () => {
  const base = reduce(
    UPM_TRACK_KEYS,
    (result, key) => {
      set(result, key, null);
      return result;
    },
    {}
  );
  const { getCookie, setCookie, deleteCookie } = useCookies();

  // ---
  function cleanParams() {
    const url = new URL(window.location.toString());
    const cleanUrl = new URL(window.location.toString());

    // Delete each upm_ track parameter
    forEach(UPM_TRACK_KEYS, key => {
      const upmKey = `upm_${key}`;
      const utmKey = `utm_${key}`;

      cleanUrl.searchParams.delete(upmKey);
      cleanUrl.searchParams.delete(utmKey);
    });

    // Update router only if params have changed
    if (!isEqual(cleanUrl.searchParams, url.searchParams)) {
      window.history.replaceState("", "", cleanUrl);
    }
  }

  // ---

  function getTracking() {
    return getCookie(UPM_TRACK_COOKIE)
      .then(cookie => {
        const trackAtob = atob(`${cookie}`);
        const values = Object.freeze(
          defaultsDeep(
            pick(JSON.parse(trackAtob), UPM_TRACK_KEYS),
            keyBy(UPM_TRACK_KEYS, () => null)
          )
        );
        return values;
      })
      .catch(() => {
        // deleteCookie(UPM_TRACK_COOKIE);
        return Promise.reject("No tracking cookie found");
      });
  }

  async function track() {
    // Get existing track cookie and Abort if exists
    await getTracking()
      .then(tracking => {
        if (tracking) {
          cleanParams();
          return Promise.resolve(tracking);
        }
        return Promise.reject("No tracking cookie found");
      })
      .catch(() => null);

    // Otherwise generate a new tracking cookie from the Current query
    return new Promise((resolve, reject) => {
      const query = new URL(window.location.toString()).searchParams;

      // Track object
      const trackObj = reduce(
        UPM_TRACK_KEYS,
        (result, key) => {
          const upmKey = `upm_${key}`;
          const utmKey = `utm_${key}`;
          const val = query.get(upmKey) || query.get(utmKey) || null;
          if (val) set(result, key, val);
          return result;
        },
        {}
      );

      // Track values if there were any
      if (!isEmpty(trackObj)) {
        // Set track cookie
        setCookie(
          UPM_TRACK_COOKIE,
          btoa(JSON.stringify(defaultsDeep(trackObj, base))),
          7776000 /* 90 days */
        );

        // clean track query params
        cleanParams();

        // Return track object
        return resolve(trackObj);
      } else {
        reject("No tracking values found");
      }
    });
  }

  // ---
  return {
    getTracking,
    deleteCookie: () => deleteCookie(UPM_TRACK_COOKIE),
    track,
  };
};
