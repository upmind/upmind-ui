import {
  ROUTE,
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
      path: "/empty",
      name: ROUTE.EMPTY,
      component: () => UpmEmptyView,
    },
  ],
};
