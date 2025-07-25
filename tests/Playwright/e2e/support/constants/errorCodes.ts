export const ErrorCodes = {
  plannedMaintenance: {
    route: "**/api/config/organisation/values*",
    url: "http://qa-automation.local:5173/product/add/3de78642-de53-9714-76df-21208469530d",
    errorCode: 503,
    status: "error",
    responseError: {
      id: null,
      type: 503,
      code: "planned_maintenance",
      message: "Service temporarily unavailable",
      data: null
    },
    button: "reload-page"
  },

  unauthorizedAccess: {
    route: "**/api/*",
    url: "http://qa-automation.local:5173/product/add/20403869-6e54-721d-264c-518d9305e7d2",
    errorCode: 403,
    status: "error",
    responseError: {
      id: null,
      type: 0,
      code: 403,
      message: "Product not found",
      data: null
    },
    button: "continue-shopping"
  },

  productNotFound: {
    route: "**/api/basket/products/**",
    url: "http://qa-automation.local:5173/product/add/20403869-6e54-721d-264c-518d9305e7d2",
    errorCode: 404,
    status: "error",
    responseError: {
      id: null,
      type: 0,
      code: 404,
      message: "Product not found",
      data: null
    },
    button: "continue-shopping"
  },
  generic500: {
    route: "**/api/*",
    url: "http://qa-automation.local:5173/product/add/20403869-6e54-721d-264c-518d9305e7d2",
    errorCode: 500,
    status: "error",
    responseError: {
      id: null,
      type: 0,
      code: 500,
      message: "Sorry, we are experiencing technical issues",
      data: null
    },
    button: "reload-page"
  },
  timeout504: {
    route: "**/api/*",
    url: "http://qa-automation.local:5173/product/add/20403869-6e54-721d-264c-518d9305e7d2",
    errorCode: 504,
    status: "error",
    responseError: {
      id: null,
      type: 0,
      code: 504,
      message: "Sorry, we have experienced an error",
      data: null
    },
    button: "back-to-shopping"
  }
};
