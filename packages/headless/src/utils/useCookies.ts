// ---  external
import { isEnabled, getCookie, setCookie, removeCookie } from "tiny-cookie";
import { set } from "lodash-es";

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
      options ??= {};
      set(options, "domain", topLevelDomain);
      setCookie(key, value, encoder, options);
    },
    remove: removeCookie,
    removeTopLevel: (key: string, options?: CookieOptions) => {
      options ??= {};
      set(options, "domain", topLevelDomain);
      removeCookie(key, options);
    },
    isEnabled,
  };
}
