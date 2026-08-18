export default {
  register: () => {},

  // Note: no `profile` / `profile.edit` routes (AC-61, design.md §8). Both
  // pages mounted the client-surface `usePersonalDetails*` composables with
  // no client id and no scope of their own — with the scope matrix's
  // `STAFF: null as never` (R1), that would keep rendering the STAFF actor's
  // own session while presenting as an admin client view: the FE-2824 shape
  // made visible. Deleted, not marked "unsupported" — a rendered
  // not-supported notice would still be a route that resolves to something,
  // and the parity table's staff-onbehalf drop (parity.yaml B-staff-onbehalf,
  // dropped-capabilities.md D1/D2) is exactly this capability. The landing
  // redirect below moves to the next surviving admin route.
  routes: [
    {
      path: "/admin/account",
      name: "admin.account",
      redirect: { name: "admin.account.security" },
      component: () => import("./Index.vue"),
      children: [
        {
          path: "child-accounts",
          name: "admin.account.child-accounts",
          component: () => import("../childAccounts/admin/ChildAccounts.vue"),
          meta: {
            nav: {
              label: "Child Accounts",
              icon: "users-plus",
              section: "Admin",
              order: 8
            }
          }
        },
        {
          path: "delegates",
          name: "admin.account.delegates",
          component: () => import("../delegates/admin/Delegates.vue"),
          meta: {
            nav: {
              label: "Delegates",
              icon: "users-01",
              section: "Admin",
              order: 6
            }
          }
        },
        {
          path: "delegates/:delegateId",
          name: "admin.account.delegates.delegate",
          component: () => import("../delegates/admin/Delegate.vue"),
          meta: {
            nav: {
              label: "Delegate Detail",
              icon: "user-01",
              section: "Admin",
              order: 7,
              hidden: true
            }
          }
        },
        {
          path: "notifications",
          name: "admin.account.notifications",
          component: () => import("../notifications/admin/Notifications.vue"),
          meta: {
            nav: {
              label: "Notifications",
              icon: "bell-01",
              section: "Admin",
              order: 4
            }
          }
        },
        {
          path: "email-history",
          name: "admin.account.email-history",
          component: () => import("../emailHistory/admin/EmailHistory.vue"),
          meta: {
            nav: {
              label: "Email History",
              icon: "mail-01",
              section: "Admin",
              order: 5
            }
          }
        },
        {
          path: "email-history/:emailId",
          name: "admin.account.email-history.view",
          component: () => import("../emailHistory/admin/Email.vue"),
          meta: {
            nav: {
              label: "Email View",
              icon: "eye",
              section: "Admin",
              order: 5,
              hidden: true
            }
          }
        },
        {
          path: "security",
          name: "admin.account.security",
          component: () => import("../security/admin/Security.vue"),
          meta: {
            nav: {
              label: "Security",
              icon: "shield-01",
              section: "Admin",
              order: 3
            }
          }
        },
        {
          path: "affiliate",
          name: "admin.account.affiliate",
          component: () => import("../affiliate/admin/Affiliate.vue"),
          meta: {
            nav: {
              label: "Affiliate",
              icon: "gift-01",
              section: "Admin",
              order: 9
            }
          }
        },
        {
          path: "notes",
          name: "admin.account.notes",
          component: () => import("../notes/admin/Notes.vue"),
          meta: {
            nav: {
              label: "Notes",
              icon: "file-01",
              section: "Admin",
              order: 10
            }
          }
        }
      ]
    }
  ]
};
