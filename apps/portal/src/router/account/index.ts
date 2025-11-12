import { ROUTE } from "../types";

export default [
  {
    path: "/account",
    name: ROUTE.ACCOUNT,
    redirect: { name: ROUTE.ACCOUNT_PROFILE }
  },
  {
    path: "/account/profile",
    name: ROUTE.ACCOUNT_PROFILE,
    component: () => import("../../views/account/profile/Profile.vue")
  },
  {
    path: "/account/child-accounts",
    name: ROUTE.ACCOUNT_CHILD_ACCOUNTS,
    component: () =>
      import("../../views/account/childAccounts/ChildAccounts.vue")
  },
  {
    path: "/account/delegates",
    name: ROUTE.ACCOUNT_DELEGATES,
    component: () => import("../../views/account/delegates/Delegates.vue")
  },
  {
    path: "/account/delegates/:delegateId",
    // path: "/account/delegates/:delegateId(${RegexMatch.UUID})",
    name: ROUTE.ACCOUNT_DELEGATES_DELEGATE,
    component: () => import("../../views/account/delegates/Delegate.vue")
  },
  {
    path: "/account/notifications",
    name: ROUTE.ACCOUNT_NOTIFICATIONS,
    component: () =>
      import("../../views/account/notifications/Notifications.vue")
  },
  {
    path: "/account/email-history",
    name: ROUTE.ACCOUNT_EMAIL_HISTORY,
    component: () => import("../../views/account/emailHistory/EmailHistory.vue")
  },
  {
    path: "/account/security",
    name: ROUTE.ACCOUNT_SECURITY,
    component: () => import("../../views/account/security/Security.vue")
  },
  {
    path: "/account/affiliate",
    name: ROUTE.ACCOUNT_AFFILIATE,
    component: () => import("../../views/account/affiliate/Affiliate.vue")
  },
  {
    path: "/account/notes",
    name: ROUTE.ACCOUNT_NOTES,
    component: () => import("../../views/account/notes/Notes.vue")
  },
  {
    path: "/account/billing",
    name: ROUTE.ACCOUNT_BILLING,
    component: () => import("../../views/account/billing/Billing.vue")
  }
];
