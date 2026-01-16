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
          component: () => import("./profile/Profile.vue")
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
          }
        },
        {
          path: "child-accounts",
          name: "account.child-accounts",
          component: () => import("./childAccounts/ChildAccounts.vue")
        },
        {
          path: "delegates",
          name: "account.delegates",
          component: () => import("./delegates/Delegates.vue")
        },
        {
          path: "delegates/:delegateId",
          name: "account.delegates.delegate",
          component: () => import("./delegates/Delegate.vue")
        },
        {
          path: "notifications",
          name: "account.notifications",
          component: () => import("./notifications/Notifications.vue")
        },
        {
          path: "email-history",
          name: "account.email-history",
          component: () => import("./emailHistory/EmailHistory.vue")
        },
        {
          path: "email-history/:emailId",
          name: "account.email-history.view",
          component: () => import("./emailHistory/Email.vue")
        },
        {
          path: "security",
          name: "account.security",
          component: () => import("./security/Security.vue")
        },
        {
          path: "affiliate",
          name: "account.affiliate",
          component: () => import("./affiliate/Affiliate.vue")
        },
        {
          path: "notes",
          name: "account.notes",
          component: () => import("./notes/Notes.vue")
        }
      ]
    }
  ]
};
