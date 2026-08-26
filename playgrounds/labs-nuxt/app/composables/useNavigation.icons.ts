// -----------------------------------------------------------------------------
/**
 * @module composables/useNavigation.icons
 * @description Declared icon NAME → lucide component, for the navigation
 * derivation.
 *
 * `@upmind/ui` is lucide-only, and `SidebarNavItem.icon` takes a component
 * rather than a name. A route's `meta.nav.icon` and the scenario registry both
 * declare a STRING, so this table is the one place those two vocabularies meet.
 * Every name here was previously handed to a string-named `Icon` that knew none
 * of them, and every nav row drew the fallback glyph.
 *
 * A name absent from the table falls back to `Layers`, which is what an
 * unmapped family already meant.
 */

import {
  Beaker,
  Boxes,
  Building2,
  Code,
  FileText,
  Folder,
  Hash,
  House,
  Layers,
  Lock,
  Mail,
  MapPin,
  Package,
  Phone,
  Receipt,
  Shield,
  ShoppingBag,
  ShoppingCart,
  User,
  Users
} from "lucide-vue-next";
import { get } from "lodash-es";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

/** The unmapped case — a family with no icon of its own still lists. */
export const FALLBACK_ICON: Component = Layers;

const NAV_ICONS: Record<string, Component> = {
  "beaker-01": Beaker,
  "building-01": Building2,
  "code-browser": Code,
  "layers-three-01": Layers,
  "lock-01": Lock,
  "mail-01": Mail,
  "marker-pin-01": MapPin,
  "phone-01": Phone,
  "shopping-bag-02": ShoppingBag,
  "shopping-cart-01": ShoppingCart,
  "shield-01": Shield,
  "user-01": User,
  "users-01": Users,
  box: Boxes,
  folder: Folder,
  hash: Hash,
  "home-01": House,
  list: FileText,
  package: Package,
  receipt: Receipt
};

/** The component a declared name resolves to, or the fallback. */
export function navIcon(name?: string): Component {
  if (!name) return FALLBACK_ICON;
  return get(NAV_ICONS, name, FALLBACK_ICON);
}
