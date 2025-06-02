// --- external

// --- internal
import services from "./services";

// --- utils

/**
 * Composable function to manage session-related logic using Vue.
 * It provides state, context and helpers for session, login and registration processes.
 *
 * @param {Function} [inspector] - Optional function that can inspect the session's state and context changes.
 * @returns {object} Session management API (see below for details)
 */
export const useTransfer = (inspector?: Function) => {
  function isExternalURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.host !== window.location.host;
    } catch (e) {
      return false;
    }
  }
  function parseInternalUrl(path: string): string {
    try {
      const url = new URL(path, window.location.origin);
      return url.href;
    } catch (e) {
      return path;
    }
  }

  // ---------------------------------------------------------------------------

  /**
   * Session transfer function.
   * This function is responsible for transferring session data between different parts of the application.
   * It handles the transfer code and redirect URL, and ensures that the session is properly initialized.
   * @returns {Promise<boolean>} A promise that resolves when the transfer is complete.
   */
  async function transfer(): Promise<boolean> {
    const route = new URL(window.location.href);
    // Convert URLSearchParams to Record<string, any>
    const searchParams: Record<string, any> = {};
    route.searchParams.forEach((value, key) => {
      searchParams[key] = value;
    });

    let transfer = false;

    const code = route.searchParams.get("code");
    const redirect = route.searchParams.get("redirect");

    await services
      .transferFrom({ transfer: { code, redirect } })
      .then(() => (transfer = true))
      .catch((error: any) => {
        console.warn("Transfer failed:", error);
      });

    // this also forces a full page reload and resets the app state
    // this is particularly important if we redirect with query params, like adding a product to the basket
    if (redirect) {
      if (isExternalURL(redirect)) {
        window.location.href = redirect;
      } else {
        window.location.href = parseInternalUrl(redirect);
      }
    } else {
      window.location.href = window.location.origin;
    }

    return transfer;
  }

  // ---------------------------------------------------------------------------
  return {
    transferFrom: transfer,
  };
};
