// -----------------------------------------------------------------------------
/**
 * @module portal/fixtures/legacy-menus
 * @description The LEGACY client portal's own section menus, transcribed
 * exactly from `src/router/client/{billing,account,support}` — sub-items and
 * their children included. These are the portal's menus, not any one brand's,
 * which is why they live here rather than in a brand fixture: the
 * `pillar-submenu-items` data ref is brand-agnostic, so every brand that
 * adopts it gets legacy's menus gated by ITS OWN facts (`mock/selectors.ts`
 * applies each dataset's `features`, exactly as legacy's `if:` predicates did).
 *
 * The PRODUCTS section menu is not here: legacy built it in the VIEW
 * (`views/client/products/index.vue`) from the client's own categories, so it
 * is derived in `mock/selectors.ts` (`productsSubmenuItems`) instead — data,
 * not a hand-authored list.
 */

import {
  Coins,
  CreditCard,
  FileClock,
  KeyRound,
  Link2,
  MessagesSquare,
  Package,
  Receipt,
  ShieldCheck,
  UserRound,
  UsersRound,
  Wallet
} from "lucide-vue-next";
import type { MenuItem } from "../modules/menu/types";
// -----------------------------------------------------------------------------

/**
 * Legacy `billing/menu.ts` — its items, WITHOUT legacy's children (operator
 * ruling 2026-08-26): "Place new order" duplicated the primary nav's own tab,
 * and the Paid/Unpaid/Credited children pointed at status routes the composed
 * invoices page already presents as its three panels. "My legacy invoices" is
 * absent: dropped-with-issue (plan §1.5).
 */
export const LEGACY_BILLING_SUBMENU: readonly MenuItem[] = [
  { to: "/billing/orders", label: "My orders", icon: Package },
  { to: "/billing/invoices", label: "My invoices", icon: Receipt },
  { to: "/billing/credit-notes", label: "Credit notes", icon: Receipt },
  { to: "/billing/payment-methods", label: "Payment methods", icon: Wallet },
  { to: "/billing/credit", label: "Account credit", icon: Coins },
  { to: "/billing/settings", label: "Settings", icon: CreditCard }
];

/**
 * Legacy `clientAccountMenu()`, verbatim — including the Affiliate
 * programme's three children and Logs' two. The gated entries (notes &
 * secrets, child accounts, affiliate) are NOT filtered here: the selector
 * applies each brand's own facts.
 */
export const LEGACY_ACCOUNT_SUBMENU: readonly MenuItem[] = [
  { to: "/account/profile", label: "Profile", icon: UserRound },
  { to: "/account/notes", label: "Notes and secrets", icon: KeyRound },
  { to: "/account/security", label: "Security", icon: ShieldCheck },
  {
    to: "/account/notifications",
    label: "Notifications",
    icon: MessagesSquare
  },
  { to: "/account/delegates", label: "Account delegates", icon: UsersRound },
  { to: "/account/child-accounts", label: "Child accounts", icon: UsersRound },
  // No children on Affiliate or Logs (operator ruling 2026-08-26): legacy's
  // ?view= tab routes point at pages that already present every panel at
  // once, so the children navigated without changing anything.
  { to: "/account/affiliate", label: "Affiliate program", icon: Link2 },
  { to: "/account/logs", label: "Logs", icon: FileClock }
];

/** Legacy `supportMenu`, verbatim — "My tickets" with its own "Add" child. */
export const LEGACY_SUPPORT_SUBMENU: readonly MenuItem[] = [
  {
    to: "/support/tickets",
    label: "My tickets",
    icon: MessagesSquare,
    children: [
      { to: "/support/tickets/new", label: "Add", icon: MessagesSquare }
    ]
  }
];
