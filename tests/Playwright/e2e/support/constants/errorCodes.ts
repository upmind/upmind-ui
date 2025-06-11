export const ErrorCodes = {
  plannedMaintenance: {
    errorCode: 503,
    status: "error",
    responseError: {
      id: null,
      type: 503,
      code: "planned_maintenance",
      message: "Service temporarily unavailable",
      data: null,
    },
  },
  //   unauthorizedAccess: {
  //     errorCode: 403,
  //     status: "error",
  //     responseError: {
  //       id: null,
  //       type: 0,
  //       code: 403,
  //       message: "Unauthorized access to product!",
  //       data: null,
  //     },
  //   },
  //   pageNotFound: {
  //     errorCode: 404,
  //     status: "error",
  //     responseError: {
  //       id: null,
  //       type: 0,
  //       code: 404,
  //       message: "Page not found",
  //       data: null,
  //     },
  //   },
};
