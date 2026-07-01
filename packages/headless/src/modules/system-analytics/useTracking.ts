import { useI18n } from "../system-localisation";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useCookies
} from "../../utils";
import {
  defaultsDeep,
  forEach,
  isEmpty,
  isEqual,
  set,
  reduce,
  pick
} from "lodash-es";

// --- Types
const UPM_TRACK_KEYS = ["source", "medium", "campaign", "content", "term"];
const UPM_TRACK_COOKIE = "upm_track";

// -----------------------------------------------------------------------------

/**
 * Composable function to handle user tracking data. The `useTracking` hook provides mechanisms for initialising,
 * retrieving, and managing tracking data from cookies. This may include generating and storing
 * tracking data based on query parameters and providing methods to retrieve or clear this data.
 *
 * Note that the composable relies on external libraries and configurations such as cookies and URL handling.
 */
export const useTracking = () => {
  const { get: getCookie, set: setCookie, remove: removeCookie } = useCookies();

  // --- state

  const base = reduce(
    UPM_TRACK_KEYS,
    (result, key) => {
      set(result, key, null);
      return result;
    },
    {}
  );

  async function init() {
    const { t } = useI18n();

    // Get existing track cookie and Abort if exists
    return (
      getTracking()
        .then(tracking => {
          if (tracking) {
            cleanParams();
            return tracking;
          } else
            throw new DetailedError(
              t("error.tracking_cookie_not_available"),
              responseCodes.Unprocessable_Entity,
              ErrorOrigin.Headless
            );
        })
        // Otherwise generate a new tracking cookie from the Current query
        .catch(
          () =>
            new Promise(resolve => {
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
                setCookie(UPM_TRACK_COOKIE, defaultsDeep(trackObj, base), {
                  expires: "90d"
                });

                // clean track query params
                cleanParams();

                // Return track object
                resolve(trackObj);
              } else {
                resolve(null);
              }
            })
        )
    );
  }

  // --- methods

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
      history.replaceState(history.state, "", cleanUrl);
    }
  }

  function getTracking() {
    const { t } = useI18n();

    return new Promise((resolve, reject) => {
      const cookie = getCookie(UPM_TRACK_COOKIE);

      if (!cookie)
        return reject(
          new DetailedError(
            t("error.tracking_cookie_not_available"),
            responseCodes.Unprocessable_Entity,
            ErrorOrigin.Headless
          )
        );

      const values = Object.freeze(
        defaultsDeep(
          pick(cookie, UPM_TRACK_KEYS),
          reduce(
            UPM_TRACK_KEYS,
            (result, key) => {
              set(result, key, null);
              return result;
            },
            {} as Record<string, null>
          )
        )
      );
      resolve(values);
    });
  }

  function remove() {
    removeCookie(UPM_TRACK_COOKIE);
  }

  // ---------------------------------------------------------------------------
  return {
    // --- state

    /**
     * Initializes the tracking cookie from query params if not present.
     * @returns {Promise<Record<string, string|null>|null>} Resolves to the tracking values or null.
     */
    init,

    // --- methods

    /**
     * Gets the current tracking cookie values.
     * @returns {Promise<Record<string, string|null>>} Resolves to the tracking values.
     */
    get: getTracking,

    /**
     * Removes the tracking cookie.
     * @returns {void}
     */
    remove
  };
};

/** The return type of {@link useTracking} composable. */
export type UseTracking = ReturnType<typeof useTracking>;
