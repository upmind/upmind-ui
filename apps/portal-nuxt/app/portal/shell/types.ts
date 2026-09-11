// -----------------------------------------------------------------------------
/**
 * @module portal/shell/types
 * @description Prop and slot contracts for `PortalFrame`, `PortalSlotContent`
 * and the `FixtureMarker` test double (tasks.md 2.1, design.md §D2, §D5).
 */

import type { MenuItem } from "../modules/menu/types";
import type { ResolvedShell, ResolvedSlot } from "../resolve";
import type { HTMLAttributes, VNode } from "vue";

/** Which of the three stacked chrome bars a `ShellHeader` is (§D4). */
export const CHROME_LEVEL = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  TERTIARY: "tertiary"
} as const;

export type ChromeLevel = (typeof CHROME_LEVEL)[keyof typeof CHROME_LEVEL];

/**
 * How much of the `utility` primitive is on canvas: `persistent` takes the
 * shell grid's third column at `lg+` and moves off-canvas below it; `hidden`
 * stays off-canvas at every width.
 */
export const ACTION_PANE_VARIANT = {
  PERSISTENT: "persistent",
  HIDDEN: "hidden"
} as const;

export type ActionPaneVariant =
  (typeof ACTION_PANE_VARIANT)[keyof typeof ACTION_PANE_VARIANT];

export interface PortalActionPaneProps {
  readonly variant: ActionPaneVariant;
  /** id of the pane element — the trigger's `aria-controls` target. */
  readonly paneId: string;
  /** Accessible name of the `<aside>` landmark, and the drawer's title. */
  readonly label: string;
  /** Accessible label for the drawer's close button. */
  readonly closeLabel: string;
  /** Off-canvas state — the consumer's, bound with `v-model:open`. */
  readonly open: boolean;
}

export type PortalActionPaneEmits = {
  "update:open": [open: boolean];
};

/** Test keys the nested rail's rows carry, shared with its focus lookup. */
export const SIDEBAR_NAV_LINK_KEY = "sidebar-nav-link";
export const SIDEBAR_NAV_BACK_KEY = "sidebar-nav-back";

/** Which row the rail puts focus on once the next level has rendered. */
export type PortalSidebarNavFocus =
  | { readonly kind: "back" }
  | { readonly kind: "row"; readonly label: string };

export interface PortalSidebarNavProps {
  /** The whole tree; `path` names which level of it renders. */
  readonly items: readonly MenuItem[];
  /** The labels drilled into, outermost first. Controlled by the consumer. */
  readonly path: readonly string[];
  /** Accessible name of the rail's own `<nav>` landmark. */
  readonly label: string;
  /** Prefix for the back row's accessible name — the level it leaves follows it. */
  readonly backLabel: string;
  /** The sidebar rail's collapsed state, threaded from `ShellSidebar`'s slot scope. */
  readonly collapsed?: boolean;
}

export type PortalSidebarNavEmits = {
  "update:path": [path: string[]];
};

export interface PortalFrameProps {
  /** The output of `resolve(config, route)` (design.md §D5) — PortalFrame renders exactly this, and nothing it was not given. */
  shell: ResolvedShell;
  /** Accessible name of the sidebar's wrapped `<nav>` landmark, and its mobile-drawer title. No English default (CC22) — the consumer names their own portal's navigation. */
  sidebarLabel: string;
  /** Accessible label for the sidebar's mobile-drawer close button. */
  sidebarCloseLabel: string;
  /**
   * Prefix for the sidebar's `nested` variant back-row accessible name
   * (tasks.md 3.4) — required unconditionally, like `sidebarLabel`, whether
   * or not the configured variant is `nested`. No English default (CC22).
   */
  sidebarBackLabel: string;
  /** Accessible name of the `utility` primitive's `<aside>` landmark, and its off-canvas drawer title (tasks.md 3.2). */
  actionPaneLabel: string;
  /** Accessible label for the action pane's mobile-drawer close button. */
  actionPaneCloseLabel: string;
  /** Accessible label for the topbar-mounted `ActionPaneTrigger` that opens the `utility` primitive's off-canvas drawer (tasks.md 3.2). No English default (CC22). */
  actionPaneTriggerLabel: string;
  /** The skip-to-content link's visible and accessible text. */
  skipLabel: string;
  class?: HTMLAttributes["class"];
}

export interface PortalFrameSlots {
  /** Page content — mounted in `ShellMain`. */
  default?: () => VNode[];
  /** Brand mark, mounted above the config-driven sidebar slots. The board's slot vocabulary has no "identity" home for it yet outside a registered module (Task 5). */
  logo?: (props: { collapsed: boolean }) => VNode[];
  /** Trailing topbar content the config's slot vocabulary does not model yet — mounted after the configured `topbar.right` content. */
  "header-actions"?: () => VNode[];
  /** Fixed sidebar-footer content, beneath the config-driven `sidebar.bottom` slot. */
  "sidebar-footer"?: (props: { collapsed: boolean }) => VNode[];
  /** Global shell footer. Renders only when provided. */
  footer?: () => VNode[];
}

export interface PortalSlotContentProps {
  /**
   * The resolved slot to render: absent renders nothing, `rejected` dev-logs
   * and renders nothing, `module` mounts the registry's component, `group`
   * recurses over its members (§D6). Named `resolvedSlot`, not `slot` — a
   * component prop literally named `slot` collides with Vue's own deprecated
   * slot-distribution attribute and every static-analysis tool that greps
   * for it.
   */
  resolvedSlot?: ResolvedSlot;
  /** The sidebar rail's collapsed state (tasks.md 2.7) — PortalFrame's own `ShellSidebar` slot scope, never `injectShellContext`: the mobile drawer passes `false` here through that SAME scope precisely because a drawer is never a rail. Absent for non-sidebar slots. */
  collapsed?: boolean;
}

export interface PortalConfirmDialogProps {
  /** The dismissing button's label — no English default (CC22); the dialog's own copy arrives with each confirmation. */
  cancelLabel: string;
}

export interface PortalFormDialogProps {
  /** Accessible label for the dialog's close button — no English default (CC22). */
  closeLabel: string;
}

export interface PortalProseDialogProps {
  /** Accessible label for the dialog's close button — no English default (CC22). */
  closeLabel: string;
}

/** What the form engine hands its glyph component (`@upmind/ui` `FormIcon`). */
export interface PortalFormIconProps {
  /** The name to render — a bare string, or the engine's `{ name, path }` bag. */
  readonly icon?: string | { readonly name?: string; readonly path?: string };
  /** `xs` where the glyph stands alone; omitted where a parent sizes it. */
  readonly size?: string;
}

export interface FixtureMarkerProps {
  /** The resolved variant name, if the slot assignment named one — rendered as text so a screenshot can tell which config produced it. */
  variant?: string;
}
