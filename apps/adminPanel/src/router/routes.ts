// --- internal

import { useBrand } from "@upmind-automation/client-vue";
import { flatMap, isArray, isString, trimStart } from "lodash-es";

// --- types
import { ROUTE, RegexMatch } from "./types";
import type {
  RouteLocationGeneric,
  RouteLocationNormalizedLoaded
} from "vue-router";

// -----------------------------------------------------------------------------

export default [
  /**
   * Catch-all route for handling not found pages within the  context.
   * Redirects to a generic error (404) page component.
   */
  {
    path: "/:pathMatch(.*)*",
    name: ROUTE.NOT_FOUND,
    component: () => import("../pages/Error.vue"),
    meta: {}
  },

  // ---------------------------------------------------------------------------

  /**
   * Route for the loading state of the application.
   * This is typically the default route when the application is initializing.
   * It may display a loading indicator while data is being fetched or processed.
   */
  {
    path: "/",
    name: ROUTE.HOME,
    component: () => import("../pages/Index.vue")
  },

  /**
   * Route that redirects to the storefront, either external or internal based on brand settings.
   * If an external storefront URL is configured, the browser will navigate to that URL.
   * Otherwise, it redirects to the internal catalogue or basket route.
   */
  {
    path: "/storefront",
    name: ROUTE.STOREFRONT,
    redirect: () => {
      const { hasStorefront, storefrontUrl } = useBrand();

      // Redirect to external storefront URL if available
      if (storefrontUrl.value) window.location.replace(storefrontUrl.value);

      // Fallback to home  route
      return { name: ROUTE.HOME };
    }
  },

  /**
   * Routes for session management including login, registration, logout, and password recovery.
   * These routes are nested under /auth for better organization.
   */
  {
    path: "/auth",
    name: ROUTE.SESSION,
    component: () => import("../pages/session/Index.vue"),
    children: [
      {
        path: "login",
        name: ROUTE.SESSION_LOGIN,
        component: () => import("../pages/session/Login.vue")
      },
      {
        path: "register",
        name: ROUTE.SESSION_REGISTER,
        alias: ["signup"],
        component: () => import("../pages/session/Register.vue")
      },
      {
        path: "logout",
        name: ROUTE.SESSION_END,
        alias: ["signout"],
        component: () => import("../pages/session/End.vue")
      },
      {
        path: "recover",
        name: ROUTE.SESSION_RECOVER_PASSWORD,
        component: () => import("../pages/session/Recover.vue")
      }
    ]
  },

  {
    path: "/billing",
    name: ROUTE.BILLING,
    redirect: { name: ROUTE.BILLING_DETAILS },
    component: () => import("../pages/billing/Index.vue"),
    children: [
      {
        path: "details",
        name: ROUTE.BILLING_DETAILS,
        component: () => import("../pages/billing/Billing.vue")
      }
    ]
  },

  {
    path: "/account",
    name: ROUTE.ACCOUNT,
    redirect: { name: ROUTE.ACCOUNT_PROFILE },
    component: () => import("../pages/account/Index.vue"),
    children: [
      {
        path: "login",
        redirect: { name: ROUTE.SESSION_LOGIN }
      },
      {
        path: "profile",
        name: ROUTE.ACCOUNT_PROFILE,
        component: () => import("../pages/account/profile/Profile.vue")
      },
      {
        path: "profile/edit",
        name: ROUTE.ACCOUNT_PROFILE_EDIT,
        component: () => import("../pages/account/profile/Edit.vue"),
        props: ({ query }: RouteLocationNormalizedLoaded) => {
          let fields: string[] = [];
          if (isString(query?.fields)) {
            fields = query.fields.split(",");
          } else if (isArray(query?.fields)) {
            fields = flatMap(query.fields, f =>
              isString(f) ? f.split(",") : []
            );
          }
          return { fields };
        }
      },
      {
        path: "child-accounts",
        name: ROUTE.ACCOUNT_CHILD_ACCOUNTS,
        component: () =>
          import("../pages/account/childAccounts/ChildAccounts.vue")
      },
      {
        path: "delegates",
        name: ROUTE.ACCOUNT_DELEGATES,
        component: () => import("../pages/account/delegates/Delegates.vue")
      },
      {
        path: "delegates/:delegateId",
        // path: "delegates/:delegateId(${RegexMatch.UUID})",
        name: ROUTE.ACCOUNT_DELEGATES_DELEGATE,
        component: () => import("../pages/account/delegates/Delegate.vue")
      },
      {
        path: "notifications",
        name: ROUTE.ACCOUNT_NOTIFICATIONS,
        component: () =>
          import("../pages/account/notifications/Notifications.vue")
      },
      {
        path: "email-history",
        name: ROUTE.ACCOUNT_EMAIL_HISTORY,
        component: () =>
          import("../pages/account/emailHistory/EmailHistory.vue")
      },
      {
        path: "email-history/:emailId",
        name: ROUTE.ACCOUNT_EMAIL_HISTORY_VIEW,
        component: () => import("../pages/account/emailHistory/Email.vue")
        // props: (to: RouteLocationNormalizedLoaded) => {
        //   return {
        //     emailId: to.params?.emailId || ""
        //   };
        // }
      },
      {
        path: "security",
        name: ROUTE.ACCOUNT_SECURITY,
        component: () => import("../pages/account/security/Security.vue")
      },
      {
        path: "affiliate",
        name: ROUTE.ACCOUNT_AFFILIATE,
        component: () => import("../pages/account/affiliate/Affiliate.vue")
      },
      {
        path: "notes",
        name: ROUTE.ACCOUNT_NOTES,
        component: () => import("../pages/account/notes/Notes.vue")
      }
    ]
  }
];
