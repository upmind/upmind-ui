import { parse, type ParsedDomain } from "psl";
import { isEnabled, getCookie, setCookie, removeCookie } from "tiny-cookie";
import useUpmind from "../useUpmind";
import { isEmpty, set, forEach } from "lodash-es";

// --- types
/**
 * Callback for cookie change events (CookieStore API).
 * Added for session-store/sync compatibility (FE-2825).
 */
export type CookieChangeCallback = (event: CookieChangeEvent) => void;

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

/** Apex domains where domain cookies should NOT be set, as it can cause issues across tenants who haven't set a custom apex domain */
const RESTRICTED_APEX_DOMAINS = ["upmind.app", "upmind.dev", "upmind.com"];

/** Module-level set of change listeners (CookieStore API). */
const changeListeners = new Set<CookieChangeCallback>();

function handleCookieStoreChange(event: CookieChangeEvent): void {
  forEach([...changeListeners], callback => {
    try {
      callback(event);
    } catch (err) {
      console.error("[useCookies] Error in change listener:", err);
    }
  });
}

if (typeof window !== "undefined" && "cookieStore" in window) {
  (window as any).cookieStore.addEventListener(
    "change",
    handleCookieStoreChange
  );
}

export function useCookies() {
  const domain = window.location.hostname;
  const apexDomain = getApexDomain(window.location.hostname);

  function isBase64Encoded(str: string): boolean {
    try {
      // Attempt to decode the string
      atob(str);
      // If decoding succeeds, it's likely Base64 encoded
      return true;
    } catch (_e) {
      // If an error occurs (e.g., InvalidCharacterError), it's not valid Base64
      return false;
    }
  }

  function getApexDomain(hostname?: URL["hostname"]) {
    hostname = hostname || window.location.hostname;
    const parsed = parse(hostname) as ParsedDomain;
    return parsed?.domain || hostname;
  }

  /** Check if the current apex domain is restricted (shared Upmind domains) */
  function isRestrictedDomain(): boolean {
    return RESTRICTED_APEX_DOMAINS.includes(apexDomain);
  }

  // NB by default we always use JSON parse/strigify and base64 encoding to encode/decode the cookie value
  const defaultEncoder = (value: any) =>
    useUpmind.debug ? JSON.stringify(value) : btoa(JSON.stringify(value));
  const defaultDecoder = (value: string) =>
    JSON.parse(isBase64Encoded(value) ? atob(value) : value);

  return {
    get: (
      key: string,
      encoder: Encoder<any> = defaultDecoder
    ): string | Record<string, any> | null => {
      try {
        return getCookie(key, encoder);
      } catch (_e) {
        // TEMPORARY: we need to log this error, as it may be useful for debugging in sentry
        // console.error(" Error converting basket", error);
        return null;
      }
    },
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

      // Prevent setting domain cookies on restricted apex domains (shared Upmind domains)
      // This avoids cross-tenant cookie conflicts
      if (isRestrictedDomain()) {
        setCookie(key, value, encoder, options);
        return;
      }

      // NB we always set the cookie for both the current domain and the top-level domain
      // this is to ensure that the cookie is available if the top-level domain fails to set the cookie
      set(options, "domain", apexDomain);
      setCookie(key, value, encoder, options);

      const success = getCookie(key, encoder);
      if (isEmpty(success)) {
        set(options, "domain", domain);
        setCookie(key, value, encoder, options);
      }
    },
    remove: removeCookie,
    addChangeListener: (callback: CookieChangeCallback): (() => void) => {
      changeListeners.add(callback);
      return () => changeListeners.delete(callback);
    },
    removeChangeListener: (callback: CookieChangeCallback): void => {
      changeListeners.delete(callback);
    },
    isChangeListenerSupported: (): boolean => {
      return typeof window !== "undefined" && "cookieStore" in window;
    },
    removeTopLevel: (key: string, options?: CookieOptions) => {
      options ??= {};

      // On restricted domains, cookies are only set at the current subdomain level
      if (isRestrictedDomain()) {
        removeCookie(key, options);
        return;
      }

      // NB we always remove the cookie for both the current domain and the top-level domain
      set(options, "domain", apexDomain);
      removeCookie(key, options);
      set(options, "domain", domain);
      removeCookie(key, options);
    },
    isEnabled
  };
}
