// --- components
import {
  UpmSessionLoginView,
  UpmSessionRegisterView,
  UpmSessionLogoutView,
} from "@upmind-automation/client-vue";

// --- utils
import { useRoutingFlows, ROUTE } from "@upmind-automation/client-vue";

export default {
  register: () => {
    // Register the core routing flows, this is where we customize the routing flows
    const { session } = useRoutingFlows();
    session.register();
  },
  routes: [
    {
      path: "/auth",
      name: ROUTE.SESSION,
      component: () => UpmSessionRegisterView,
    },
    {
      path: "/auth/login",
      name: ROUTE.SESSION_LOGIN,
      component: () => UpmSessionLoginView,
    },
    {
      path: "/auth/register",
      name: ROUTE.SESSION_REGISTER,
      alias: ["/auth/signup"],
      component: () => UpmSessionRegisterView,
    },
    {
      path: "/auth/logout",
      alias: ["/auth/signout"],
      name: ROUTE.SESSION_END,
      component: () => UpmSessionLogoutView,
    },
  ],
};
