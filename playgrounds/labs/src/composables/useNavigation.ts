// Navigation configuration for Labs sidebar
// Add new routes here to have them appear in the sidebar
// Icon names must match files in assets/icons/Line/ folder (without .svg extension)

export interface NavItem {
  label: string;
  icon?: string;
  route?: string; // route name
  dynamic?: boolean; // true if route has dynamic params (not directly navigable)
  children?: NavItem[];
}

export const navigation: NavItem[] = [
  // --- Top-level lab items
  { label: "Brand", route: "brand", icon: "palette" },
  { label: "Places API", route: "places", icon: "marker-pin-01" },
  { label: "Feedback", route: "feedback", icon: "message-chat-circle" },
  {
    label: "Forms",
    icon: "file-01",
    children: [
      { label: "Address Form", route: "form.address", icon: "home-01" },
      { label: "Domain Form", route: "form.domain", icon: "globe-01" }
    ]
  },

  // --- Client Management
  {
    label: "Client Management",
    icon: "users-01",
    children: [
      {
        label: "Client Area",
        icon: "layout-alt-01",
        children: [
          { label: "Slots", route: "client-area.slots", icon: "grid-01" },
          {
            label: "Template",
            route: "client-area.template",
            icon: "layers-two-01"
          }
        ]
      },
      {
        label: "Client Data",
        icon: "database-01",
        children: [
          {
            label: "Addresses",
            route: "client.addresses",
            icon: "marker-pin-01"
          },
          { label: "Phones", route: "client.phones", icon: "phone-01" },
          { label: "Emails", route: "client.emails", icon: "mail-01" },
          { label: "Companies", route: "client.companies", icon: "building-01" }
        ]
      }
    ]
  },

  // --- Products
  {
    label: "Products",
    icon: "shopping-bag-02",
    children: [
      { label: "Catalogue", route: "products.catalogue", icon: "grid-01" },
      {
        label: "Product Detail",
        route: "products.catalogue.detail",
        icon: "eye",
        dynamic: true
      }
    ]
  },

  // --- Invoices
  {
    label: "Invoices",
    icon: "receipt",
    children: [
      { label: "Invoice List", route: "invoices", icon: "file-01" },
      { label: "Invoice Detail", route: "invoice", icon: "eye" }
    ]
  },

  // --- Session
  {
    label: "Session",
    icon: "lock-01",
    children: [
      { label: "Login", route: "session-login", icon: "log-in-01" },
      { label: "Register", route: "session-register", icon: "user-plus-01" },
      { label: "Recover Password", route: "session-recover", icon: "key-01" },
      { label: "Logout", route: "session-end", icon: "log-out-01" }
    ]
  },

  // --- Portal
  {
    label: "Portal",
    icon: "user-01",
    children: [
      {
        label: "Account",
        icon: "user-01",
        children: [
          { label: "Profile", route: "account.profile", icon: "user-01" },
          {
            label: "Profile Edit",
            route: "account.profile.edit",
            icon: "edit-01",
            dynamic: true
          },
          { label: "Security", route: "account.security", icon: "shield-01" },
          {
            label: "Notifications",
            route: "account.notifications",
            icon: "bell-01"
          },
          {
            label: "Email History",
            route: "account.email-history",
            icon: "mail-01"
          },
          {
            label: "Email View",
            route: "account.email-history.view",
            icon: "eye",
            dynamic: true
          },
          { label: "Delegates", route: "account.delegates", icon: "users-01" },
          {
            label: "Delegate Detail",
            route: "account.delegates.delegate",
            icon: "user-01",
            dynamic: true
          },
          {
            label: "Child Accounts",
            route: "account.child-accounts",
            icon: "users-plus"
          },
          { label: "Affiliate", route: "account.affiliate", icon: "gift-01" },
          { label: "Notes", route: "account.notes", icon: "file-01" }
        ]
      },
      {
        label: "Billing",
        icon: "credit-card-01",
        children: [
          {
            label: "Billing Details",
            route: "billing.details",
            icon: "credit-card-01"
          }
        ]
      }
    ]
  },

  // --- Admin Portal
  {
    label: "Admin Portal",
    icon: "shield-01",
    children: [
      {
        label: "Account",
        icon: "user-01",
        children: [
          { label: "Profile", route: "admin.account.profile", icon: "user-01" },
          {
            label: "Profile Edit",
            route: "admin.account.profile.edit",
            icon: "edit-01",
            dynamic: true
          },
          {
            label: "Security",
            route: "admin.account.security",
            icon: "shield-01"
          },
          {
            label: "Notifications",
            route: "admin.account.notifications",
            icon: "bell-01"
          },
          {
            label: "Email History",
            route: "admin.account.email-history",
            icon: "mail-01"
          },
          {
            label: "Email View",
            route: "admin.account.email-history.view",
            icon: "eye",
            dynamic: true
          },
          {
            label: "Delegates",
            route: "admin.account.delegates",
            icon: "users-01"
          },
          {
            label: "Delegate Detail",
            route: "admin.account.delegates.delegate",
            icon: "user-01",
            dynamic: true
          },
          {
            label: "Child Accounts",
            route: "admin.account.child-accounts",
            icon: "users-plus"
          },
          {
            label: "Affiliate",
            route: "admin.account.affiliate",
            icon: "gift-01"
          },
          { label: "Notes", route: "admin.account.notes", icon: "file-01" }
        ]
      },
      {
        label: "Billing",
        icon: "credit-card-01",
        children: [
          {
            label: "Billing Details",
            route: "admin.billing.details",
            icon: "credit-card-01"
          }
        ]
      }
    ]
  }
];

export default navigation;
