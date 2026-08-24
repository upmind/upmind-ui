// -----------------------------------------------------------------------------
/**
 * @module components/icon/icon-map
 * @description Untitled-UI icon name → lucide-vue-next component map.
 *
 * The old lib rendered string-named SVGs from a custom "Untitled UI" pack. The
 * new lib (`@upmind/ui`) is lucide-only, so this table re-expresses
 * each UI glyph used in client-vue as its lucide v1 equivalent. Targets are
 * audited against `lucide-vue-next@^1.0.0` — lucide reordered many names in the
 * 0.x→1.x cutover (`AlertTriangle`→`TriangleAlert`, `CheckCircle`→`CircleCheck`,
 * `Loader2`→`LoaderCircle`, …), so the v0 names do NOT apply here.
 *
 * Names absent from this map (country flags, provider logos, anything not yet
 * mapped) fall through to the registered SVG asset loader; see Icon.vue.
 */
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleCheckBig,
  CirclePlus,
  CircleQuestionMark,
  CircleUser,
  Clock,
  Delete,
  Dot,
  Globe,
  Info,
  Languages,
  List,
  LoaderCircle,
  Lock,
  Mail,
  Moon,
  OctagonAlert,
  Paperclip,
  Plus,
  RefreshCw,
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  CircleAlert,
  Search,
  Settings,
  Share2,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  SquarePen,
  Sun,
  Tag,
  Timer,
  TriangleAlert,
  Trash2,
  Undo2,
  User,
  UserPlus,
  X
} from "lucide-vue-next";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

/**
 * Untitled-UI name → lucide v1 component.
 *
 * Judgement calls (closest lucide glyph, flagged for the manual sweep):
 * - `clock-fast-forward` → Clock — lucide has no clock+forward-arrow glyph;
 *   plain Clock keeps the clock face without implying a wrong direction.
 * - `search-refraction` → Search — lucide has no "refraction" lens variant.
 * - `check-circle-broken` → CircleCheckBig — gapped ring + check matches.
 * - `delete` → Delete — the Untitled "delete" glyph IS the backspace key.
 */
export const ICON_MAP: Record<string, Component> = {
  "alert-octagon": OctagonAlert,
  "alert-triangle": TriangleAlert,
  "alert-circle": CircleAlert,
  "arrow-down": ArrowDown,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  "arrow-up": ArrowUp,
  basket: ShoppingBasket,
  "building-07": Building2,
  check: Check,
  "check-circle": CircleCheck,
  "check-circle-broken": CircleCheckBig,
  "chevron-down": ChevronDown,
  "chevron-right": ChevronRight,
  "clock-fast-forward": Clock,
  "clock-stopwatch": Timer,
  delete: Delete,
  dot: Dot,
  "edit-01": SquarePen,
  "file-attachment-01": Paperclip,
  "flip-backward": Undo2,
  "info-circle": Info,
  internet: Globe,
  list: List,
  "loading-01": LoaderCircle,
  "lock-01": Lock,
  "lock-04": Lock,
  "mail-01": Mail,
  moon: Moon,
  plus: Plus,
  "plus-circle": CirclePlus,
  "refresh-cw-01": RefreshCw,
  search: Search,
  "search-md": Search,
  "switch-horizontal-02": ArrowRightLeft,
  "search-refraction": Search,
  "settings-04": Settings,
  "share-07": Share2,
  "shopping-bag-02": ShoppingBag,
  "shopping-cart-01": ShoppingCart,
  sun: Sun,
  "switch-horizontal-01": ArrowLeftRight,
  "tag-02": Tag,
  "translate-01": Languages,
  "trash-02": Trash2,
  "user-01": User,
  "user-03": User,
  "user-circle": CircleUser,
  "user-plus-01": UserPlus,
  "x-close": X
};

/** Visible fallback glyph — rendered (never blank) when nothing else resolves. */
export const FALLBACK_ICON: Component = CircleQuestionMark;

/** Resolve an Untitled-UI name to its lucide component, or undefined if unmapped. */
export function resolveLucideIcon(
  name: string | undefined
): Component | undefined {
  if (!name) return undefined;
  return ICON_MAP[name];
}
