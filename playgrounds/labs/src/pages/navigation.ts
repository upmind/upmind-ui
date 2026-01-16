// Navigation configuration for Labs sidebar
// Add new routes here to have them appear in the sidebar

export interface NavItem {
  label: string;
  icon?: string;
  route?: string; // route name
  dynamic?: boolean; // true if route has dynamic params (not directly navigable)
  children?: NavItem[];
}

export const navigation: NavItem[] = [
  {
    label: "Labs",
    icon: "beaker",
    children: [
      { label: "Brand", route: "brand", icon: "palette" },
      { label: "Places API", route: "places", icon: "map-pin" },
      { label: "Feedback", route: "feedback", icon: "message-square" },
      {
        label: "Forms",
        icon: "file-text",
        children: [
          { label: "Address Form", route: "form.address" },
          { label: "Domain Form", route: "form.domain" }
        ]
      }
    ]
  },
  {
    label: "Client Management",
    icon: "users",
    children: [
      {
        label: "Client Area",
        icon: "layout",
        children: [
          { label: "Slots", route: "client-area.slots" },
          { label: "Template", route: "client-area.template" }
        ]
      },
      {
        label: "Client Data",
        icon: "database",
        children: [
          { label: "Addresses", route: "client.addresses" },
          { label: "Phones", route: "client.phones" },
          { label: "Emails", route: "client.emails" },
          { label: "Companies", route: "client.companies" }
        ]
      }
    ]
  },
  {
    label: "Products",
    icon: "package",
    children: [
      { label: "Catalogue", route: "products.catalogue" },
      {
        label: "Product Detail",
        route: "products.catalogue.detail",
        dynamic: true
      }
    ]
  },
  {
    label: "Invoices",
    icon: "file-text",
    children: [
      { label: "Invoice List", route: "invoices" },
      { label: "Invoice Detail", route: "invoice" }
    ]
  },
  {
    label: "Session",
    icon: "lock",
    children: [
      { label: "Login", route: "session-login" },
      { label: "Register", route: "session-register" },
      { label: "Recover Password", route: "session-recover" },
      { label: "Logout", route: "session-end" }
    ]
  },
  {
    label: "Portal",
    icon: "user",
    children: [
      {
        label: "Account",
        icon: "user-circle",
        children: [
          { label: "Profile", route: "account.profile" },
          {
            label: "Profile Edit",
            route: "account.profile.edit",
            dynamic: true
          },
          { label: "Security", route: "account.security" },
          { label: "Notifications", route: "account.notifications" },
          { label: "Email History", route: "account.email-history" },
          {
            label: "Email View",
            route: "account.email-history.view",
            dynamic: true
          },
          { label: "Delegates", route: "account.delegates" },
          {
            label: "Delegate Detail",
            route: "account.delegates.delegate",
            dynamic: true
          },
          { label: "Child Accounts", route: "account.child-accounts" },
          { label: "Affiliate", route: "account.affiliate" },
          { label: "Notes", route: "account.notes" }
        ]
      },
      {
        label: "Billing",
        icon: "credit-card",
        children: [{ label: "Billing Details", route: "billing.details" }]
      }
    ]
  },
  {
    label: "Admin Portal",
    icon: "shield",
    children: [
      {
        label: "Account",
        icon: "user-circle",
        children: [
          { label: "Profile", route: "admin.account.profile" },
          {
            label: "Profile Edit",
            route: "admin.account.profile.edit",
            dynamic: true
          },
          { label: "Security", route: "admin.account.security" },
          { label: "Notifications", route: "admin.account.notifications" },
          { label: "Email History", route: "admin.account.email-history" },
          {
            label: "Email View",
            route: "admin.account.email-history.view",
            dynamic: true
          },
          { label: "Delegates", route: "admin.account.delegates" },
          {
            label: "Delegate Detail",
            route: "admin.account.delegates.delegate",
            dynamic: true
          },
          { label: "Child Accounts", route: "admin.account.child-accounts" },
          { label: "Affiliate", route: "admin.account.affiliate" },
          { label: "Notes", route: "admin.account.notes" }
        ]
      },
      {
        label: "Billing",
        icon: "credit-card",
        children: [{ label: "Billing Details", route: "admin.billing.details" }]
      }
    ]
  }
];

export default navigation;
