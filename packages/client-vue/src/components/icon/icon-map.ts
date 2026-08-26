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
  Boxes,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  CircleCheckBig,
  CirclePause,
  CirclePlay,
  CirclePlus,
  CircleQuestionMark,
  CircleStop,
  CircleUser,
  Clock,
  Columns3,
  Delete,
  Dot,
  EllipsisVertical,
  Eye,
  Globe,
  House,
  Inbox,
  Info,
  Languages,
  List,
  LoaderCircle,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Moon,
  OctagonAlert,
  Paperclip,
  Phone,
  Plus,
  RefreshCw,
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  CircleAlert,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  ShoppingCart,
  SkipBack,
  SkipForward,
  SquarePen,
  Star,
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
 * - `search-lg` / `search-md` / `search-sm` → Search — lucide has one lens, and
 *   size is the `Icon` component's own prop, never the name's.
 * - `building-01` / `building-02` / `building-07` → Building2, and
 *   `trash-01` / `trash-02` → Trash2 — Untitled numbered its variants; lucide
 *   ships one glyph per subject.
 * - `box` → Boxes, matching the labs navigation table so one declared name
 *   draws one glyph wherever it is rendered.
 * - `shield-tick` → ShieldCheck — same shield, lucide's spelling of the tick.
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
  box: Boxes,
  "building-01": Building2,
  "building-02": Building2,
  "building-07": Building2,
  check: Check,
  "check-circle": CircleCheck,
  "check-circle-broken": CircleCheckBig,
  "chevron-down": ChevronDown,
  "chevron-right": ChevronRight,
  clock: Clock,
  "clock-fast-forward": Clock,
  "clock-stopwatch": Timer,
  "columns-03": Columns3,
  delete: Delete,
  dot: Dot,
  "dots-vertical": EllipsisVertical,
  "edit-01": SquarePen,
  eye: Eye,
  "file-attachment-01": Paperclip,
  "flip-backward": Undo2,
  "globe-01": Globe,
  "home-01": House,
  "inbox-01": Inbox,
  "info-circle": Info,
  internet: Globe,
  list: List,
  "loading-01": LoaderCircle,
  "lock-01": Lock,
  "lock-04": Lock,
  "log-out-01": LogOut,
  "mail-01": Mail,
  "marker-pin-01": MapPin,
  moon: Moon,
  "pause-circle": CirclePause,
  "phone-01": Phone,
  "play-circle": CirclePlay,
  plus: Plus,
  "plus-circle": CirclePlus,
  "refresh-cw-01": RefreshCw,
  search: Search,
  "search-lg": Search,
  "search-md": Search,
  "switch-horizontal-02": ArrowRightLeft,
  "search-refraction": Search,
  "search-sm": Search,
  "settings-04": Settings,
  "share-07": Share2,
  "shield-tick": ShieldCheck,
  "shopping-bag-02": ShoppingBag,
  "shopping-cart-01": ShoppingCart,
  "skip-back": SkipBack,
  "skip-forward": SkipForward,
  "star-01": Star,
  "stop-circle": CircleStop,
  sun: Sun,
  "switch-horizontal-01": ArrowLeftRight,
  "tag-02": Tag,
  "translate-01": Languages,
  "trash-01": Trash2,
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
