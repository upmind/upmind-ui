import { URLs } from "./urls";

export const ErrorCodes = {
  plannedMaintenance: {
    route: "**/api/**",
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

  incorrectCredentials: {
    route: "**/api/**",
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
      message: "An unexpected error occurred"
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
