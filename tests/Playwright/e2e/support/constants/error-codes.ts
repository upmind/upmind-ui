import { URLs } from "./urls";

export const ErrorCodes = {
  plannedMaintenance: {
    // A 503 on a (non-brand) service call surfaces the "service unavailable"
    // modal. Scope to the product fetch so brand settings still load — a 503 on
    // brand settings means "brand doesn't exist" and redirects to the upmind
    // homepage instead (see brandUnavailable below).
    route: "**/api/basket/products/**",
    url: `${URLs.starterHosting}`,
    errorCode: 503,
    status: "error",
    responseError: {
      id: "planned_maintenance",
      type: 503,
      code: "planned_maintenance",
      message: "Service temporarily unavailable"
    },
    button: "reload-page",
    errorType: "dialog"
  },
  brandUnavailable: {
    // A 503 on brand settings means the brand doesn't exist, so the app
    // redirects to the upmind platform homepage (platformUrl) rather than
    // showing the in-app "service unavailable" modal.
    route: "**/api/brand/settings**",
    url: `${URLs.starterHosting}`,
    errorCode: 503,
    status: "error",
    responseError: {
      id: "brand_unavailable",
      type: 503,
      code: "brand_unavailable",
      message: "Service temporarily unavailable"
    },
    button: "",
    errorType: "homepage"
  },

  incorrectCredentials: {
    // Scope to the basket (orders/current) fetch, not all of /api: a 401 on
    // brand settings is treated as "no such brand" and redirects to the upmind
    // homepage. A 401 on this service call makes the app re-authenticate —
    // refresh the token and retry the call once (useQuery
    // canRetryAuthorization → refreshToken) — rather than show a dialog.
    route: "**/api/orders/current**",
    url: `${URLs.starterHosting}`,
    errorCode: 401,
    status: "error",
    responseError: {
      id: "incorrect_credentials",
      type: 0,
      code: 401,
      message: "Sorry, you are not authorized to view this page"
    },
    button: "",
    errorType: "reauth"
  },

  unauthorizedAccess: {
    route: "**/api/basket/products/**",
    url: `${URLs.starterHosting}`,
    errorCode: 403,
    status: "error",
    responseError: {
      id: "unauthorized_access",
      type: 0,
      code: 403,
      message: "Product not found"
    },
    button: "continue-shopping",
    errorType: "redirect"
  },

  productNotFound: {
    route: "**/api/basket/products/**",
    url: `${URLs.starterHosting}`,
    errorCode: 404,
    status: "error",
    responseError: {
      id: "product_not_found",
      type: 0,
      code: 404,
      message: "Product not found"
    },
    button: "continue-shopping",
    errorType: "redirect"
  },
  generic500: {
    route: "**/api/orders/current**",
    url: `${URLs.starterHosting}`,
    errorCode: 500,
    status: "error",
    responseError: {
      id: "generic_error",
      type: 0,
      code: 500,
      message:
        "We are currently experiencing technical issues. Please try again later."
    },
    button: "reload-page",
    errorType: "toast"
  },
  timeout504: {
    // A 504 raises NO global feedback, by design: query.utils.ts `mapFeedback`
    // maps Gateway_Timeout to `undefined` alongside 400/401/403/408/409/422/502
    // (only 429, 500, 503 and the network error map to a message), and the i18n
    // corpus carries no `error.504_*` copy to show. That has held since before
    // the headless migration (`5b9dc47df7^:query/utils.ts:294`), so the toast
    // this row used to expect never rendered — it was never a regression.
    route: "**/api/orders/current**",
    url: `${URLs.starterHosting}`,
    errorCode: 504,
    status: "error",
    responseError: {
      id: "timeout_error",
      type: 0,
      code: 504,
      message: "Sorry, we have experienced an error"
    },
    button: "",
    errorType: "silent"
  }
};
