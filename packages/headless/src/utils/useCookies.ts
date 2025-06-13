// ---  external
import { isEnabled, getCookie, setCookie, removeCookie } from "tiny-cookie";
import { isEmpty, set } from "lodash-es";

// --- types
declare interface CookieOptions {
  domain?: string;
  path?: string;
  expires?: Date | string | number;
  "max-age"?: number;
  secure?: boolean;
  samesite?: string;
  partitioned?: boolean;
}

declare type Encoder<T> = (value: T) => string;

// --------------------------------------------------------

export function useCookies() {
  const domain = window.location.hostname;
  const topLevelDomain = getTopLevelDomain(window.location.href);

  function getTopLevelDomain(url: string) {
    const urlParts = new URL(url).hostname.split(".");

    return urlParts
      .slice(0)
      .slice(-(urlParts.length === 4 ? 3 : 2))
      .join(".");
  }

  // NB by default we always use JSON parse/strigify and base64 encoding to encode/decode the cookie value
  const defaultEncoder = (value: any) => btoa(JSON.stringify(value));
  const defaultDencoder = (value: string) => JSON.parse(atob(value));

  return {
    get: (
      key: string,
      encoder: Encoder<any> = defaultDencoder
    ): string | Record<string, any> | null => getCookie(key, encoder),
    set: (
      key: string,
      value: any,
      options?: CookieOptions,
      encoder: Encoder<any> = defaultEncoder
    ) => setCookie(key, value, encoder, options),
    setTopLevel: (
      key: string,
      value: any,
      options?: CookieOptions,
      encoder: Encoder<any> = defaultEncoder
    ) => {
      // NB we always set the cookie for both the current domain and the top-level domain
      // this is to ensure that the cookie is available if the top-level domain fails to set the cookie
      options ??= {};

      set(options, "domain", topLevelDomain);
      setCookie(key, value, encoder, options);

      const success = getCookie(key, encoder);
      if (isEmpty(success)) {
        set(options, "domain", domain);
        setCookie(key, value, encoder, options);
      }
    },
    remove: removeCookie,
    removeTopLevel: (key: string, options?: CookieOptions) => {
      // NB we always remove the cookie for both the current domain and the top-level domain
      options ??= {};
      set(options, "domain", topLevelDomain);
      removeCookie(key, options);
      set(options, "domain", domain);
      removeCookie(key, options);
    },
    isEnabled,
  };
}
