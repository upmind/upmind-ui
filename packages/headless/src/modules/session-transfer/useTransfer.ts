// -----------------------------------------------------------------------------
/**
 * @module session-transfer/useTransfer
 * @description Composable for session transfer functionality.
 */

import { sessionTransferServices as services } from "./session-transfer.services";
import type { IAuthTransfer } from "./session-transfer.types";
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
  function isExternalURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.host !== window.location.host;
    } catch (_e) {
      return false;
    }
  }

  function parseInternalUrl(path: string): string {
    try {
      const url = new URL(path, window.location.origin);
      return url.href;
    } catch (_e) {
      return path;
    }
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
   * @returns {Promise<boolean>} True if transfer succeeded, false otherwise.
   */
  async function transferFrom(): Promise<boolean> {
    const route = new URL(window.location.href);

    let success = false;

    const code = route.searchParams.get("code");
    const redirect = route.searchParams.get("redirect");

    // Service handles token persistence to session store
    await services
      .transferFrom({ transfer: { code, redirect } })
      .then(() => {
        success = true;
      })
      .catch((error: unknown) => {
        console.warn("Transfer failed:", error);
      });

    // Force full page reload to reset app state
    // Important when redirecting with query params (e.g., adding product to basket)
    if (redirect) {
      if (isExternalURL(redirect)) {
        window.location.href = redirect;
      } else {
        window.location.href = parseInternalUrl(redirect);
      }
    } else {
      window.location.href = window.location.origin;
    }

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
