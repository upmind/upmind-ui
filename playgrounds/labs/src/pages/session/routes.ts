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
          component: () => import("./Login.vue"),
          meta: {
            nav: {
              label: "Login",
              icon: "log-in-01",
              section: "Session",
              order: 1
            }
          }
        },
        {
          path: "register",
          name: ROUTE.SESSION_REGISTER,
          alias: ["signup"],
          component: () => import("./Register.vue"),
          meta: {
            nav: {
              label: "Register",
              icon: "user-plus-01",
              section: "Session",
              order: 2
            }
          }
        },
        {
          path: "logout",
          name: ROUTE.SESSION_END,
          alias: ["signout"],
          component: () => import("./End.vue"),
          meta: {
            nav: {
              label: "Logout",
              icon: "log-out-01",
              section: "Session",
              order: 4
            }
          }
        },
        {
          path: "recover",
          name: ROUTE.SESSION_RECOVER_PASSWORD,
          component: () => import("./Recover.vue"),
          meta: {
            nav: {
              label: "Recover Password",
              icon: "key-01",
              section: "Session",
              order: 3
            }
          }
        }
      ]
    }
  ]
};
