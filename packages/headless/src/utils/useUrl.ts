// --- utils
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
  // ensure our instance has the correct defaults
  instance = defaultsDeep(instance, {
    // @ts-ignore
    base: import.meta.env.VITE_API_URL,
    context: "api",
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

export function useUrlParams() {
  /**
   * Here we retrieve a search param from the URL
   */
  function getParamFromUrl(name: string) {
    if (!name) return null;
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  /**
   * Here we sync a search param to the URL
   */
  function syncParamToUrl(name: string, value?: string) {
    const url = new URL(window.location.toString());
    if (!value) url.searchParams.delete(name);
    else url.searchParams.set(name, value);
    window.history.replaceState(null, "", url.toString());
  }

  return {
    getParamFromUrl,
    syncParamToUrl,
  };
}
