// -----------------------------------------------------------------------------
/**
 * @module portal/registry
 * @description The module registry (design.md §D5, §D6) — every module is
 * registered once, by id, with its category, accept-tag and the component
 * PortalFrame mounts for it. Carries the Module Group entry (rendered by
 * PortalFrame's own recursion, never looked up as a component), the fixture
 * module the slot-acceptance seam needs to be provable (tasks.md 1.4), the
 * two modules pulled forward early — `menu` (tasks.md 2.7) and `bottom-nav`
 * (tasks.md 3.3) — and the nine Task 5 adds: Tabs, Breadcrumbs, Search,
 * Banner/Notice, Status Block, Empty State, Button, List and Metric. The
 * shell never imports a module directly — it looks ids up here.
 */

import AccountMenu from "./modules/account-menu/AccountMenu.vue";
import Banner from "./modules/banner/Banner.vue";
import BottomNavModule from "./modules/bottom-nav/BottomNavModule.vue";
import BrandModule from "./modules/brand/Brand.vue";
import Breadcrumbs from "./modules/breadcrumbs/Breadcrumbs.vue";
import ButtonModule from "./modules/button/Button.vue";
import CommandModule from "./modules/command/Command.vue";
import Composer from "./modules/composer/Composer.vue";
import DocumentModule from "./modules/document/Document.vue";
import EmptyStateModule from "./modules/empty-state/EmptyStateModule.vue";
import FormModule from "./modules/form/Form.vue";
import ListModule from "./modules/list/List.vue";
import ListControlsModule from "./modules/list-controls/ListControls.vue";
import Menu from "./modules/menu/Menu.vue";
import Meter from "./modules/meter/Meter.vue";
import Metric from "./modules/metric/Metric.vue";
import Notifications from "./modules/notifications/Notifications.vue";
import PaginationModule from "./modules/pagination/Pagination.vue";
import Prose from "./modules/prose/Prose.vue";
import SearchModule from "./modules/search/Search.vue";
import SettingsModule from "./modules/settings/Settings.vue";
import SpecModule from "./modules/spec/Spec.vue";
import StatusBlock from "./modules/status-block/StatusBlock.vue";
import TabsModule from "./modules/tabs/Tabs.vue";
import TimelineModule from "./modules/timeline/Timeline.vue";
import FixtureMarker from "./shell/FixtureMarker.vue";
import {
  MODULE_CATEGORY,
  MODULE_GROUP_ID,
  MODULE_REF_TAG,
  ACCEPT_TAG
} from "./types";
import type {
  AcceptTag,
  GroupAxis,
  ModuleCategory,
  ModuleGroupRef,
  ModuleRef,
  SlotAssignment
} from "./types";
import type { Component } from "vue";
// -----------------------------------------------------------------------------

export type ModuleDescriptor<
  Id extends string = string,
  Variant extends string = string
> = {
  readonly id: Id;
  readonly category: ModuleCategory;
  readonly acceptTag: AcceptTag;
  readonly variants: readonly Variant[];
  /**
   * Whether this module reads the sidebar rail's collapsed state. Declared as
   * DATA rather than discovered, per §D4's rule for the primitive table.
   * `PortalSlotContent` used to bind `collapsed` to EVERY module, so the ten
   * that never declared it took it as a fallthrough attribute and shipped
   * `collapsed="false"` on their root node in production HTML — 13 of them on
   * one route. Only a module that says it wants this gets it.
   */
  readonly readsCollapsed?: boolean;
  /** Absent for Module Group — PortalFrame renders a group by recursing over its resolved members, never by looking this up. */
  readonly component?: Component;
};

function defineModule<Id extends string, Variant extends string = never>(
  descriptor: ModuleDescriptor<Id, Variant>
): ModuleDescriptor<Id, Variant> {
  return descriptor;
}

/**
 * A named test double — not a real module. It stands in for whichever real
 * module (Task 5) a stage needs a slot-acceptance or variant-closure proof
 * against, without pretending the real module set already exists.
 */
export const FIXTURE_MODULE_ID = "fixture-marker" as const;

/** The sidebar's vertical route list (tasks.md 2.7) — the only Task-5 module pulled into Task 2. */
export const MENU_MODULE_ID = "menu" as const;

/** The `bottom` primitive's curated destination strip (tasks.md 3.3) — a separate item set from `menu`, not a reflow of it. */
export const BOTTOM_NAV_MODULE_ID = "bottom-nav" as const;

/** The board's `pills`/`underlined`(`underline`)/`segmented` variants (tasks.md 5.1). */
export const TABS_MODULE_ID = "tabs" as const;

/** The page's trail (tasks.md 5.1) — no variant of its own. */
export const BREADCRUMBS_MODULE_ID = "breadcrumbs" as const;

/** Filters a fixture dataset it is handed, client-side (tasks.md 5.2) — no variant of its own. */
export const SEARCH_MODULE_ID = "search" as const;

/** The app shell's ⌘K launcher — `search`-tagged, so it seats wherever a search does. */
export const COMMAND_MODULE_ID = "command" as const;

/** Banner/Notice — `banner` (`AnnouncementBar`) or `notice` (`Alert`) (tasks.md 5.3). */
export const BANNER_MODULE_ID = "banner" as const;

/** A single entity status, over `StatusBadge` (tasks.md 5.3) — no variant of its own. */
export const STATUS_BLOCK_MODULE_ID = "status-block" as const;

/** A determinate progress bar, over `Progress` — the Host·Grid render's setup-completion meter. No variant of its own. */
export const METER_MODULE_ID = "meter" as const;

/** A standalone empty placeholder, over `EmptyState` (tasks.md 5.3) — no variant of its own. */
export const EMPTY_STATE_MODULE_ID = "empty-state" as const;

/** The board's single/group/dropdown/split forms (tasks.md 5.4). */
export const BUTTON_MODULE_ID = "button" as const;

/** The board's compact/table/masonry/timeline forms (tasks.md 5.5), plus `cards` — the references' real multi-column shape. */
export const LIST_MODULE_ID = "list" as const;

/** A key metric or a row of them, over `StatGroup` (tasks.md 5.5) — plus the Host·Grid render's muted `tile` form. */
export const METRIC_MODULE_ID = "metric" as const;

/** A whole billing document — legacy's invoice and credit-note views, on screen and on paper. */
export const DOCUMENT_MODULE_ID = "document" as const;

/** A row footer's pager, over `Pagination` — no variant of its own. */
export const PAGINATION_MODULE_ID = "pagination" as const;

/** A panel header's search field and sort select, fed by its collection's control-state ref. No variant of its own. */
export const LIST_CONTROLS_MODULE_ID = "list-controls" as const;

/** A single-field message box (legacy's ticket reply) — emits the action seam's `${action}:${text}`. */
export const COMPOSER_MODULE_ID = "composer" as const;

/** The ONE wrapper around the design system's form engine (plan F1) — emits `${submit}:${json}`. */
export const FORM_MODULE_ID = "form" as const;

/** Legacy's topbar notifications-dropdown — bell, unread badge, the list, mark-all-read. */
export const NOTIFICATIONS_MODULE_ID = "notifications" as const;

/** Legacy's topbar profile-dropdown — the avatar opening the account destinations. */
export const ACCOUNT_MENU_MODULE_ID = "account-menu" as const;

/** Labelled term/value rows, over `DescriptionList` — a row, never a stat tile. */
export const SPEC_MODULE_ID = "spec" as const;

/** A feed of dated events over `Timeline` — legacy's product automation timeline. */
export const TIMELINE_MODULE_ID = "timeline" as const;

/** Brand-authored markdown, and the provider panels embedded beside it. */
export const PROSE_MODULE_ID = "prose" as const;

/** The portal's mark and wordmark — the only module carrying the `identity` tag. */
export const BRAND_MODULE_ID = "brand" as const;

/** The sandbox's brand and shape pickers, seated by config wherever a shape shows Settings. */
export const SETTINGS_MODULE_ID = "settings" as const;

export const REGISTRY = {
  [MODULE_GROUP_ID]: defineModule({
    id: MODULE_GROUP_ID,
    category: MODULE_CATEGORY.GROUP,
    acceptTag: ACCEPT_TAG.GROUP,
    variants: []
  }),
  [FIXTURE_MODULE_ID]: defineModule({
    id: FIXTURE_MODULE_ID,
    category: MODULE_CATEGORY.DATA,
    acceptTag: ACCEPT_TAG.CONTENT,
    variants: ["default", "alternate"],
    component: FixtureMarker
  }),
  [MENU_MODULE_ID]: defineModule({
    id: MENU_MODULE_ID,
    category: MODULE_CATEGORY.NAV,
    acceptTag: ACCEPT_TAG.NAV,
    // `dropdown`/`mega` remain unimplemented (tasks.md 5.1) — not pulled forward.
    variants: ["default", "horizontal"],
    component: Menu,
    readsCollapsed: true
  }),
  [BOTTOM_NAV_MODULE_ID]: defineModule({
    id: BOTTOM_NAV_MODULE_ID,
    category: MODULE_CATEGORY.NAV,
    acceptTag: ACCEPT_TAG.NAV,
    variants: ["default"],
    component: BottomNavModule
  }),
  [TABS_MODULE_ID]: defineModule({
    id: TABS_MODULE_ID,
    category: MODULE_CATEGORY.NAV,
    acceptTag: ACCEPT_TAG.NAV,
    variants: ["segmented", "underline", "pills"],
    component: TabsModule
  }),
  [BREADCRUMBS_MODULE_ID]: defineModule({
    id: BREADCRUMBS_MODULE_ID,
    category: MODULE_CATEGORY.NAV,
    acceptTag: ACCEPT_TAG.NAV,
    variants: ["default"],
    component: Breadcrumbs,
    readsCollapsed: true
  }),
  [SEARCH_MODULE_ID]: defineModule({
    id: SEARCH_MODULE_ID,
    category: MODULE_CATEGORY.INPUT,
    acceptTag: ACCEPT_TAG.SEARCH,
    variants: ["default"],
    component: SearchModule
  }),
  [COMMAND_MODULE_ID]: defineModule({
    id: COMMAND_MODULE_ID,
    category: MODULE_CATEGORY.ACTION,
    acceptTag: ACCEPT_TAG.SEARCH,
    variants: ["default"],
    component: CommandModule
  }),
  [BANNER_MODULE_ID]: defineModule({
    id: BANNER_MODULE_ID,
    category: MODULE_CATEGORY.FEEDBACK,
    acceptTag: ACCEPT_TAG.STATUS,
    variants: ["banner", "notice"],
    component: Banner
  }),
  [STATUS_BLOCK_MODULE_ID]: defineModule({
    id: STATUS_BLOCK_MODULE_ID,
    category: MODULE_CATEGORY.FEEDBACK,
    acceptTag: ACCEPT_TAG.STATUS,
    variants: ["default"],
    component: StatusBlock
  }),
  [METER_MODULE_ID]: defineModule({
    id: METER_MODULE_ID,
    category: MODULE_CATEGORY.FEEDBACK,
    acceptTag: ACCEPT_TAG.STATUS,
    variants: ["default"],
    component: Meter
  }),
  [EMPTY_STATE_MODULE_ID]: defineModule({
    id: EMPTY_STATE_MODULE_ID,
    category: MODULE_CATEGORY.FEEDBACK,
    acceptTag: ACCEPT_TAG.CONTENT,
    variants: ["default"],
    component: EmptyStateModule
  }),
  [BUTTON_MODULE_ID]: defineModule({
    id: BUTTON_MODULE_ID,
    category: MODULE_CATEGORY.ACTION,
    acceptTag: ACCEPT_TAG.ACTIONS,
    variants: ["single", "group", "dropdown", "split"],
    component: ButtonModule
  }),
  [LIST_MODULE_ID]: defineModule({
    id: LIST_MODULE_ID,
    category: MODULE_CATEGORY.DATA,
    acceptTag: ACCEPT_TAG.CONTENT,
    variants: [
      "compact",
      "table",
      "masonry",
      "timeline",
      "cards",
      "carousel",
      "row-cards"
    ],
    component: ListModule
  }),
  [METRIC_MODULE_ID]: defineModule({
    id: METRIC_MODULE_ID,
    category: MODULE_CATEGORY.DATA,
    acceptTag: ACCEPT_TAG.CONTENT,
    variants: ["default", "tile"],
    component: Metric
  }),
  [DOCUMENT_MODULE_ID]: defineModule({
    id: DOCUMENT_MODULE_ID,
    category: MODULE_CATEGORY.DATA,
    acceptTag: ACCEPT_TAG.CONTENT,
    variants: ["default", "print"],
    component: DocumentModule
  }),
  [PAGINATION_MODULE_ID]: defineModule({
    id: PAGINATION_MODULE_ID,
    category: MODULE_CATEGORY.NAV,
    acceptTag: ACCEPT_TAG.CONTENT,
    variants: ["default"],
    component: PaginationModule
  }),
  [LIST_CONTROLS_MODULE_ID]: defineModule({
    id: LIST_CONTROLS_MODULE_ID,
    category: MODULE_CATEGORY.INPUT,
    acceptTag: ACCEPT_TAG.CONTENT,
    variants: ["default"],
    component: ListControlsModule
  }),
  [COMPOSER_MODULE_ID]: defineModule({
    id: COMPOSER_MODULE_ID,
    category: MODULE_CATEGORY.INPUT,
    acceptTag: ACCEPT_TAG.CONTENT,
    variants: ["default"],
    component: Composer
  }),
  [FORM_MODULE_ID]: defineModule({
    id: FORM_MODULE_ID,
    category: MODULE_CATEGORY.INPUT,
    acceptTag: ACCEPT_TAG.CONTENT,
    variants: ["default"],
    component: FormModule
  }),
  [NOTIFICATIONS_MODULE_ID]: defineModule({
    id: NOTIFICATIONS_MODULE_ID,
    category: MODULE_CATEGORY.FEEDBACK,
    acceptTag: ACCEPT_TAG.STATUS,
    variants: ["default"],
    component: Notifications
  }),
  [ACCOUNT_MENU_MODULE_ID]: defineModule({
    id: ACCOUNT_MENU_MODULE_ID,
    category: MODULE_CATEGORY.NAV,
    acceptTag: ACCEPT_TAG.IDENTITY,
    variants: ["default"],
    component: AccountMenu
  }),
  [SPEC_MODULE_ID]: defineModule({
    id: SPEC_MODULE_ID,
    category: MODULE_CATEGORY.DATA,
    acceptTag: ACCEPT_TAG.CONTENT,
    variants: ["default", "micro"],
    component: SpecModule
  }),
  [TIMELINE_MODULE_ID]: defineModule({
    id: TIMELINE_MODULE_ID,
    category: MODULE_CATEGORY.DATA,
    acceptTag: ACCEPT_TAG.CONTENT,
    variants: ["default"],
    component: TimelineModule
  }),
  [PROSE_MODULE_ID]: defineModule({
    id: PROSE_MODULE_ID,
    category: MODULE_CATEGORY.DATA,
    acceptTag: ACCEPT_TAG.CONTENT,
    variants: ["markdown", "frames"],
    component: Prose
  }),
  [BRAND_MODULE_ID]: defineModule({
    id: BRAND_MODULE_ID,
    category: MODULE_CATEGORY.NAV,
    acceptTag: ACCEPT_TAG.IDENTITY,
    variants: ["default"],
    readsCollapsed: true,
    component: BrandModule
  }),
  [SETTINGS_MODULE_ID]: defineModule({
    id: SETTINGS_MODULE_ID,
    category: MODULE_CATEGORY.ACTION,
    acceptTag: ACCEPT_TAG.UTILITY,
    variants: ["default"],
    readsCollapsed: true,
    component: SettingsModule
  })
} as const;

export type ModuleId = keyof typeof REGISTRY;
export type ModuleVariantOf<Id extends ModuleId> =
  (typeof REGISTRY)[Id]["variants"][number];

/** Widened once, here, so a runtime lookup by an arbitrary (possibly-unregistered) id needs no cast. */
const REGISTRY_LOOKUP: Readonly<Record<string, ModuleDescriptor>> = REGISTRY;

export function getModuleDescriptor(id: string): ModuleDescriptor | undefined {
  return REGISTRY_LOOKUP[id];
}

/**
 * The compile-time-checked way to reference a registered module: `id` must be
 * a known registry id, and `variant` (if given) must be one that module
 * declares — the AC2.4 mechanism. A config naming a module the registry
 * doesn't carry is authored as a plain `ModuleRef` object literal instead
 * (types.ts) and is a runtime concern (AC1.3), not a compile one. Attaches
 * `MODULE_REF_TAG` whenever a variant is given, so a slot assignment naming
 * an undeclared variant can't be written as a bare literal instead and skip
 * this check (types.ts).
 */
export function moduleRef<Id extends ModuleId>(
  id: Id,
  options?: {
    readonly variant?: ModuleVariantOf<Id>;
    readonly props?: Readonly<Record<string, unknown>>;
  }
): ModuleRef {
  const variant = options?.variant;
  const props = options?.props;
  if (variant === undefined) return { kind: "module", id, props };
  return { kind: "module", id, variant, props, [MODULE_REF_TAG]: true };
}

export function moduleGroup(
  axis: GroupAxis,
  members: readonly SlotAssignment[],
  options?: {
    /** Presents the group as a CARD (types.ts `ModuleGroupRef`). */
    readonly surface?: ModuleGroupRef["surface"];
    readonly header?: ModuleGroupRef["header"];
  }
): ModuleGroupRef {
  return {
    kind: "module",
    id: MODULE_GROUP_ID,
    axis,
    members,
    surface: options?.surface,
    header: options?.header
  };
}
