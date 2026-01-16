// --- external
import { createRouter, createWebHistory } from "vue-router";

// --- internal
import routes from "./routes";

// ---types
export * from "./types";

// -----------------------------------------------------------------------------

import useUpmind, { useSession } from "@upmind-automation/headless";
import { ROUTE } from "./types";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, _savedPosition) {
    // handle scroll to anchor on same page
    if (to.hash) {
      return {
        el: to.hash,
        behavior: "smooth",
        top: 108
      };
    } else {
      // always scroll to top
      return { behavior: "smooth", top: 0 };
    }
  }
});

router.beforeEach(async (to, from) => {
  const isAuthRoute =
    to.path.startsWith("/auth") || to.name === ROUTE.NOT_FOUND;

  if (isAuthRoute) {
    const isLoginPage =
      to.name === ROUTE.SESSION_LOGIN || to.path === "/auth/login";
    const isRegisterPage =
      to.name === ROUTE.SESSION_REGISTER || to.path === "/auth/register";

    if (isLoginPage || isRegisterPage) {
      const cookieStr = document.cookie;
      const hasCookie =
        cookieStr.includes("upm_admin_session") ||
        cookieStr.includes("upm_client_session") ||
        cookieStr.includes("upm_user_session");
      const hasStorage =
        localStorage.getItem("client/auth/token") ||
        localStorage.getItem("guest/auth/token");

      if (hasCookie || hasStorage) {
        try {
          const session = useSession();
          await session.isReady();

          if (session.meta.value.isAuthenticated) {
            // Already logged in, redirect away
            let returnUrl = to.query.returnUrl?.toString() || "/account";

            // Ensure it's a relative path and NOT a login page to avoid loops
            const isLoginPath =
              returnUrl.includes("/login") || returnUrl.includes("/auth");
            if (!returnUrl.startsWith("/") || isLoginPath) {
              returnUrl = "/account";
            }

            return { path: returnUrl, replace: true };
          } else {
            return true;
          }
        } catch (e) {
          // Allow access to login page on error
          return true;
        }
      }
    }
    return true;
  }

  // Synchronous check for cookie
  const cookieStr = document.cookie;
  const hasCookie =
    cookieStr.includes("upm_admin_session") ||
    cookieStr.includes("upm_client_session") ||
    cookieStr.includes("upm_user_session");
  const hasStorage =
    localStorage.getItem("client/auth/token") ||
    localStorage.getItem("guest/auth/token");

  if (!hasCookie && !hasStorage) {
    return {
      path: "/auth/login",
      query: { returnUrl: to.fullPath },
      replace: true
    };
  }

  // Optimistic navigation: If we have a token, we assume valid session.
  // The Session Machine will handle invalid tokens by redirecting to login asynchronously.
  return true;
});

export default router;
