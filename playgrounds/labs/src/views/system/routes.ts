import {
  ROUTE,
  UpmErrorView,
  UpmEmptyView,
  UpmLoadingView,
} from "@upmind-automation/client-vue";

export default {
  register: () => {},

  routes: [
    {
      path: "/loading",
      name: ROUTE.ERROR,
      component: () => UpmLoadingView,
    },
    {
      path: "/error",
      name: ROUTE.ERROR,
      component: () => UpmErrorView,
    },
    {
      path: "/empty",
      name: ROUTE.EMPTY,
      component: () => UpmEmptyView,
    },
  ],
};
