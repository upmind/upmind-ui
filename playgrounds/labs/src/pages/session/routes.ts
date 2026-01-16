// --- components

import { ROUTE } from "../../funnels";

// --- utils
export default {
  /**
   * Routes for session management including login, registration, logout, and password recovery.
   * These routes are nested under /order/auth for better organization.
   */
  routes: [
    {
      path: "/auth",
      name: ROUTE.SESSION,
      component: () => import("./Index.vue"),
      children: [
        {
          path: "login",
          name: ROUTE.SESSION_LOGIN,
          component: () => import("./Login.vue")
        },
        {
          path: "register",
          name: ROUTE.SESSION_REGISTER,
          alias: ["signup"],
          component: () => import("./Register.vue")
        },
        {
          path: "logout",
          name: ROUTE.SESSION_END,
          alias: ["signout"],
          component: () => import("./End.vue")
        },
        {
          path: "recover",
          name: ROUTE.SESSION_RECOVER_PASSWORD,
          component: () => import("./Recover.vue")
        }
      ]
    }
  ]
};
