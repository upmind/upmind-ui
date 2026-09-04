// -----------------------------------------------------------------------------
/**
 * @module session-transfer/useTransfer
 * @description Composable for session transfer functionality.
 */

import { forEach } from "lodash-es";
import { sessionTransferServices as services } from "./session-transfer.services";
import type { IAuthTransfer } from "./session-transfer.types";
// -----------------------------------------------------------------------------

/** Schemes that may ever be navigated to from a caller-supplied value. */
const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

/** Paths that must never be a redirect target (self-referential reload loop). */
const TRANSFER_PATHS = /^\/(?:auth\/transfer\/?|transfer\.html)$/;

// -----------------------------------------------------------------------------
/**
 * Composable for session transfer functionality.
 * Provides methods to generate and consume transfer codes for cross-domain/tab session sharing.
 *
 * @returns The {@link UseTransfer} session transfer API
 *
 * @example
 * ```ts
 * const { transferTo, transferFrom } = useTransfer()
 *
 * // Generate a transfer code (e.g., for staff-to-client handoff)
 * const transferData = await transferTo()
 * console.log(transferData.code) // One-time transfer code
 *
 * // Consume a transfer code (reads from URL params by default)
 * await transferFrom()
 * ```
 */
export const useTransfer = () => {
  // --- private

  /**
   * Parse without depending on `URL.parse` — a Baseline-newly-available static
   * that is `undefined` on older browsers and would throw from inside the
   * security path, turning a validation failure into an unhandled error.
   */
  function tryParseUrl(input: string, base?: string): URL | null {
    try {
      return new URL(input, base);
    } catch {
      return null;
    }
  }

  /**
   * Canonical `host[:port]` for comparison.
   *
   * The URL parser has already lower-cased the host and applied IDNA/punycode, so
   * a unicode homograph and its ASCII form compare equal here. `port` is empty for
   * the scheme's default port, so `:443`/`:80` normalise away and `:8443` does not.
   * One trailing FQDN dot is dropped, so `allowed.com.` matches `allowed.com`.
   */
  function canonicalHost(url: URL): string {
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    return url.port ? `${hostname}:${url.port}` : hostname;
  }

  /**
   * Normalise one registered origin to a comparable `host[:port]`, or `null`.
   *
   * Real payloads carry a BARE HOST ("kn6x1dzbtcgb.upmind.dev") despite the field
   * name, so both shapes must work and neither may be guessed:
   *   - `new URL("kn6x1dzbtcgb.upmind.dev")`      throws
   *   - `new URL("https://" + "https://foo.com")` yields hostname "https"
   *   - `new URL("foo.com:8443")`                 yields scheme "foo.com:", host ""
   * Testing for the scheme first is what keeps all three correct.
   */
  function originToHost(entry: string | null | undefined): string | null {
    const raw = (entry ?? "").trim();
    if (!raw) return null;

    const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw);
    const parsed = tryParseUrl(hasScheme ? raw : `https://${raw}`);

    if (!parsed) return null;
    // A malformed record must not smuggle a scheme into the allowlist.
    if (!SAFE_PROTOCOLS.has(parsed.protocol)) return null;
    if (!parsed.hostname) return null;

    return canonicalHost(parsed);
  }

  /**
   * The set of hosts this app may redirect to: its own host, plus every live
   * brand-registered client origin.
   *
   * @param origins - Live registered origins, from `fetchAllowedOrigins`.
   */
  function allowedHosts(origins: string[]): Set<string> {
    const hosts = new Set<string>();

    const self = tryParseUrl(window.location.href);
    if (self) hosts.add(canonicalHost(self));

    forEach(origins, entry => {
      const host = originToHost(entry);
      if (host) hosts.add(host);
    });

    return hosts;
  }

  /**
   * Resolve a caller-supplied `redirect` into a URL that is safe to navigate to,
   * or `null`.
   *
   * Returns the URL OBJECT, never a boolean: the caller must navigate to exactly
   * the value that was validated. Re-parsing at the call site would resolve
   * against `document.baseURI` rather than this base, and a validate/use split is
   * where this bug class lives.
   *
   * @param raw - The untrusted `redirect` query param.
   * @param origins - Live registered origins, from `fetchAllowedOrigins`.
   */
  function safeRedirectUrl(
    raw: string | null | undefined,
    origins: string[]
  ): URL | null {
    if (!raw) return null;

    const base = window.location.origin;
    // An opaque origin serialises to "null" and cannot anchor a relative path.
    if (!base || base === "null") return null;

    const url = tryParseUrl(raw, base);
    if (!url) return null;

    // 1. Scheme allowlist, read off the PARSED protocol — never the raw string.
    //    The parser strips leading C0 controls and space, and removes ALL
    //    TAB/CR/LF anywhere in the input, so "java\tscript:" arrives here as
    //    "javascript:". A raw-string check would be bypassed by exactly that.
    if (!SAFE_PROTOCOLS.has(url.protocol)) return null;

    // 2. No TLS downgrade. Allowlist entries carry no scheme, so a host match
    //    alone would accept http:// to an allowlisted host from an https:// page.
    if (window.location.protocol === "https:" && url.protocol !== "https:")
      return null;

    // 3. No credentials. "https://allowed.com@evil.com" already fails the host
    //    check (its host is evil.com), but userinfo has no legitimate use here.
    if (url.username || url.password) return null;

    // 4. EXACT host match. Never endsWith/includes/startsWith:
    //    "evilallowed.com".endsWith("allowed.com") === true.
    //    This leg — not the scheme leg — is what stops "//evil.com",
    //    "\\evil.com", "/\evil.com" and "https:///evil.com", all of which parse
    //    as https:.
    if (!allowedHosts(origins).has(canonicalHost(url))) return null;

    // 5. Never bounce back into the transfer entrypoint.
    if (TRANSFER_PATHS.test(url.pathname)) return null;

    return url;
  }

  // --- methods
  /**
   * Generate a transfer code for the current session.
   * This creates a one-time code that can be used to transfer the session to another tab/domain.
   * @returns {Promise<IAuthTransfer>} The transfer data including the one-time code.
   */
  async function transferTo(): Promise<IAuthTransfer> {
    return services.transferTo();
  }

  /**
   * Consume a transfer code and establish the session.
   * Reads `code` and `redirect` from URL query params, then redirects appropriately.
   *
   * The `redirect` param is attacker-controlled: it is validated against a scheme
   * allowlist and the brand's registered origins before use, and only the parsed
   * result is ever navigated to. See {@link safeRedirectUrl}.
   *
   * @returns {Promise<boolean>} True if transfer succeeded, false otherwise.
   */
  async function transferFrom(): Promise<boolean> {
    const route = new URL(window.location.href);

    let success = false;

    const code = route.searchParams.get("code");
    const redirect = route.searchParams.get("redirect");

    // Run together: the allowlist does not depend on the token, so fetching it
    // after the exchange would add a serial round trip to every redirect. Skipped
    // entirely when there is no redirect to validate.
    const [, origins] = await Promise.all([
      // Service handles token persistence to session store
      services
        .transferFrom({ transfer: { code, redirect } })
        .then(() => {
          success = true;
        })
        .catch((error: unknown) => {
          console.warn("Transfer failed:", error);
        }),
      redirect ? services.fetchAllowedOrigins() : []
    ]);

    // VALIDATION is the control, not the exchange result. The redirect fires
    // regardless of whether the code was accepted — matching the existing
    // behaviour — so an expired or reused code still lands the user on the page
    // they asked for, merely unauthenticated. Gating on success would gain
    // nothing anyway: an attacker supplies their own valid code.
    const target = safeRedirectUrl(redirect, origins);

    // Force full page reload to reset app state
    // Important when redirecting with query params (e.g., adding product to basket)
    // Assign the VALIDATED object's href — never the raw parameter.
    window.location.href = target ? target.href : window.location.origin;

    return success;
  }

  // ---------------------------------------------------------------------------
  return {
    /**
     * Consume a transfer code from URL params and establish the session.
     */
    transferFrom,

    /**
     * Generate a one-time transfer code for the current session.
     */
    transferTo
  };
};

/** The return type of {@link useTransfer} composable. */
export type UseTransfer = ReturnType<typeof useTransfer>;
