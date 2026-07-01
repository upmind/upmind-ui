import { usePOP } from "./usePOP";
import { defaultsDeep, forIn, trimStart, isArray } from "lodash-es";

// ----------------------------------------------------------------------------
/**
 * Constructs a URL with the given path and query parameters.
 *
 * @param {string} path - The path to append to the base URL.
 * @param {Object} params - The query parameters to include in the URL.
 * @returns {string} The constructed URL as a string.
 */
export function useUrl(
  path: string | URL["pathname"],
  params: object = {},
  instance?: { base?: string; context?: string }
) {
  const { getApiUrl } = usePOP();

  // ensure our instance has the correct defaults
  instance = defaultsDeep(instance, {
    base: getApiUrl(),
    context: "api"
  });

  // clean up path
  path = [instance?.context, trimStart(path, "/")].join("/");
  // now we can create the url
  const url = new URL(path, instance?.base);
  // and add any params
  forIn(params, (value, key) => {
    if (isArray(value))
      (value as any[]).forEach(v => url.searchParams.append(`${key}[]`, v));
    else url.searchParams.set(key, value);
  });

  return url;
}
