import { flatMap, isArray, isString } from "lodash-es";
import type { RouteLocationNormalizedLoaded } from "vue-router";

export default {
  register: () => {},

  routes: [
    {
      path: "/account",
      name: "account",
      redirect: { name: "account.profile" },
      component: () => import("./Index.vue"),
      children: [
        {
          path: "profile",
          name: "account.profile",
          component: () => import("./profile/Profile.vue"),
          meta: {
            nav: {
              label: "Profile",
              icon: "user-01",
              section: "Portal",
              order: 1
            }
          }
        },
        {
          path: "profile/edit",
          name: "account.profile.edit",
          component: () => import("./profile/Edit.vue"),
          props: ({ query }: RouteLocationNormalizedLoaded) => {
            let fields: string[] = [];
            if (isString(query?.fields)) {
              fields = query.fields.split(",");
            } else if (isArray(query?.fields)) {
              fields = flatMap(query.fields, f =>
                isString(f) ? f.split(",") : []
              );
            }
            return { fields };
          },
          meta: {
            nav: {
              label: "Profile Edit",
              icon: "edit-01",
              section: "Portal",
              order: 2,
              hidden: true
            }
          }
        },
        {
          path: "child-accounts",
          name: "account.child-accounts",
          component: () => import("./childAccounts/ChildAccounts.vue"),
          meta: {
            nav: {
              label: "Child Accounts",
              icon: "users-plus",
              section: "Portal",
              order: 8
            }
          }
        },
        {
          path: "delegates",
          name: "account.delegates",
          component: () => import("./delegates/Delegates.vue"),
          meta: {
            nav: {
              label: "Delegates",
              icon: "users-01",
              section: "Portal",
              order: 6
            }
          }
        },
        {
          path: "delegates/:delegateId",
          name: "account.delegates.delegate",
          component: () => import("./delegates/Delegate.vue"),
          meta: {
            nav: {
              label: "Delegate Detail",
              icon: "user-01",
              section: "Portal",
              order: 7,
              hidden: true
            }
          }
        },
        {
          path: "notifications",
          name: "account.notifications",
          component: () => import("./notifications/Notifications.vue"),
          meta: {
            nav: {
              label: "Notifications",
              icon: "bell-01",
              section: "Portal",
              order: 4
            }
          }
        },
        {
          path: "email-history",
          name: "account.email-history",
          component: () => import("./emailHistory/EmailHistory.vue"),
          meta: {
            nav: {
              label: "Email History",
              icon: "mail-01",
              section: "Portal",
              order: 5
            }
          }
        },
        {
          path: "email-history/:emailId",
          name: "account.email-history.view",
          component: () => import("./emailHistory/Email.vue"),
          meta: {
            nav: {
              label: "Email View",
              icon: "eye",
              section: "Portal",
              order: 5,
              hidden: true
            }
          }
        },
        {
          path: "email-history-scoped",
          name: "account.email-history.scoped",
          component: () => import("./emailHistory/Scoped.vue"),
          meta: {
            nav: {
              label: "Email History (scoped)",
              icon: "mail-02",
              section: "Portal",
              order: 11
            }
          }
        },
        {
          path: "email-history-scoped/:emailId",
          name: "account.email-history.scoped.view",
          component: () => import("./emailHistory/ScopedEmail.vue"),
          meta: {
            nav: {
              label: "Email View (scoped)",
              icon: "eye",
              section: "Portal",
              order: 11,
              hidden: true
            }
          }
        },
        {
          path: "security",
          name: "account.security",
          component: () => import("./security/Security.vue"),
          meta: {
            nav: {
              label: "Security",
              icon: "shield-01",
              section: "Portal",
              order: 3
            }
          }
        },
        {
          path: "affiliate",
          name: "account.affiliate",
          component: () => import("./affiliate/Affiliate.vue"),
          meta: {
            nav: {
              label: "Affiliate",
              icon: "gift-01",
              section: "Portal",
              order: 9
            }
          }
        },
        {
          path: "notes",
          name: "account.notes",
          component: () => import("./notes/Notes.vue"),
          meta: {
            nav: {
              label: "Notes",
              icon: "file-01",
              section: "Portal",
              order: 10
            }
          }
        }
      ]
    }
  ]
};
