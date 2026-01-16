import { flatMap, isArray, isString } from "lodash-es";
import type { RouteLocationNormalizedLoaded } from "vue-router";

export default {
  register: () => {},

  routes: [
    {
      path: "/admin/account",
      name: "admin.account",
      redirect: { name: "admin.account.profile" },
      component: () => import("./Index.vue"),
      children: [
        {
          path: "profile",
          name: "admin.account.profile",
          component: () => import("../profile/admin/Profile.vue")
        },
        {
          path: "profile/edit",
          name: "admin.account.profile.edit",
          component: () => import("../profile/admin/Edit.vue"),
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
          }
        },
        {
          path: "child-accounts",
          name: "admin.account.child-accounts",
          component: () => import("../childAccounts/admin/ChildAccounts.vue")
        },
        {
          path: "delegates",
          name: "admin.account.delegates",
          component: () => import("../delegates/admin/Delegates.vue")
        },
        {
          path: "delegates/:delegateId",
          name: "admin.account.delegates.delegate",
          component: () => import("../delegates/admin/Delegate.vue")
        },
        {
          path: "notifications",
          name: "admin.account.notifications",
          component: () => import("../notifications/admin/Notifications.vue")
        },
        {
          path: "email-history",
          name: "admin.account.email-history",
          component: () => import("../emailHistory/admin/EmailHistory.vue")
        },
        {
          path: "email-history/:emailId",
          name: "admin.account.email-history.view",
          component: () => import("../emailHistory/admin/Email.vue")
        },
        {
          path: "security",
          name: "admin.account.security",
          component: () => import("../security/admin/Security.vue")
        },
        {
          path: "affiliate",
          name: "admin.account.affiliate",
          component: () => import("../affiliate/admin/Affiliate.vue")
        },
        {
          path: "notes",
          name: "admin.account.notes",
          component: () => import("../notes/admin/Notes.vue")
        }
      ]
    }
  ]
};
