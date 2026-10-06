// -----------------------------------------------------------------------------
/**
 * @module portal/fixtures/hostgrid
 * @description hostgrid's product groups and its ⌘K destinations.
 *
 * The primary nav is NOT here: legacy gated its six tabs on brand config, so
 * it is DATA now — the `pillar-nav-items` ref, built by `mock/selectors.ts`
 * from each dataset's own gates (plan R8). A static six-tab list could only
 * ever render the gates-ON branch.
 *
 * The section menus are the PORTAL's, not this brand's, so they live in
 * `legacy-menus.fixture.ts` — every brand adopting the `pillar-submenu-items`
 * ref gets them, gated by its own facts.
 */

import { Package } from "lucide-vue-next";
import { MOCK_ACTION, mockActionValue } from "../mock/actions";
import { defineProductGroup } from "../routes";
import { map } from "lodash-es";
import type { CommandModuleItem } from "../modules/command/types";
import type { ProductGroup } from "../types";
// -----------------------------------------------------------------------------

/** The single generic bucket — legacy's "Products & Services" pillar, one non-reserved slug. */
const GROUP_NAV: readonly { group: ProductGroup; icon: typeof Package }[] = [
  {
    group: defineProductGroup({ slug: "products", label: "Products" }),
    icon: Package
  }
];

export const HOSTGRID_GROUPS: readonly ProductGroup[] = map(
  GROUP_NAV,
  entry => entry.group
);

/**
 * The ⌘K palette's destinations — every primary tab, plus the pages a client
 * reaches often enough to type for. Authored rather than derived from the nav
 * selector: a `MenuItem` may carry no `to` at all (a group label, an external
 * storefront), and a fallback path would put a fictional destination in the
 * palette. A test asserts every primary destination appears here, which is
 * what stops the two drifting.
 */
const COMMAND_DESTINATIONS: readonly { to: string; label: string }[] = [
  { to: "/", label: "Dashboard" },
  { to: "/products", label: "Products & Services" },
  { to: "/billing", label: "Billing" },
  { to: "/account", label: "My Account" },
  { to: "/support", label: "Support" },
  { to: "/products/order", label: "Place New Order" },
  // The brand's own menu page — the nav injects it, so the palette carries it
  // too (`tests/app-shell-chrome.test.ts` holds the two together).
  { to: "/getting-started", label: "Getting started" },
  { to: "/billing/invoices", label: "Invoices" },
  { to: "/billing/orders", label: "Orders" },
  { to: "/support/tickets", label: "Tickets" },
  { to: "/account/profile", label: "Profile" }
];

export const HOSTGRID_COMMAND_ITEMS: readonly CommandModuleItem[] = map(
  COMMAND_DESTINATIONS,
  destination => ({
    value: mockActionValue(MOCK_ACTION.NAVIGATE, destination.to),
    label: destination.label
  })
);
