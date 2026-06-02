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
    // homepage. A 401 on this service call surfaces the in-app "not authorized"
    // modal.
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
    button: "back-to-shopping",
    errorType: "dialog"
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
    button: "back-to-shopping",
    errorType: "toast"
  }
};
