// -----------------------------------------------------------------------------
/**
 * @module portal/modules/list/types
 * @description Prop contract for the `list` module (tasks.md 5.5) — its
 * `compact`, `table`, `masonry` and `timeline` variants, over `@upmind/ui`'s
 * `ListRoot`/`ListItem`, `Table`, `ListRoot layout="masonry"` and `Timeline`.
 *
 * `ListModuleItem` is the design system's generic item shape (tasks.md 5.8,
 * AC6.6): a leading visual, a title, a description and trailing text — never
 * a domain field (`siteName`, `price`, `instructor`). Every one of the
 * three product shapes' items (tasks.md Task 6) fits this: a thumbnail and a
 * price badge, a favicon and a plan badge, a class icon and an instructor
 * line, are all leading/title/description/trailing content, not new fields.
 */

import type { BadgeVariants } from "@upmind/ui";
import type { Component } from "vue";
// -----------------------------------------------------------------------------

export const LIST_MODULE_VARIANT = {
  COMPACT: "compact",
  TABLE: "table",
  MASONRY: "masonry",
  TIMELINE: "timeline",
  /**
   * A GRID of cards, media above the text — every multi-column region in the
   * three references is this, not the CSS-column `masonry`. `masonry` puts
   * `ListItem` rows into narrow column boxes, and a row is ~500px of
   * unshrinkable flex content, so at two columns and up it overflows into its
   * neighbour instead of laying out.
   */
  CARDS: "cards",
  /** The cards, on one horizontally scrolling strip — the Assets board's `list.carousel` ("Recent Assets", its last tile cut by the viewport). */
  CAROUSEL: "carousel",
  /**
   * Each item its own full-width bordered card — the Host·Grid render's
   * "Active products" rows: a leading tile, title and description, an outline
   * action and a `moreActions` menu, one card per row rather than `compact`'s
   * divided stack.
   */
  ROW_CARDS: "row-cards"
} as const;

export type ListModuleVariant =
  (typeof LIST_MODULE_VARIANT)[keyof typeof LIST_MODULE_VARIANT];

/** The CSS column count `masonry` pins at every breakpoint (variants.ts). Four is the widest the references use (Rockzone's four-across "Recent orders"). */
export type ListModuleColumns = 1 | 2 | 3 | 4;

/**
 * One tabular cell beyond the row's own title — the `table` variant's middle
 * columns. Generic like every other member here: a value and how it reads,
 * never a domain field.
 */
export type ListModuleCell = {
  readonly value: string;
  /** Right-aligned tabular figures — amounts, counts, ids (`TableCell`'s own `numeric`). */
  readonly numeric?: boolean;
};

/** One heading of the `table` variant's header row, in render order. */
export type ListModuleHeading = {
  readonly label: string;
  readonly numeric?: boolean;
};

export type ListModuleItem = {
  readonly id: string;
  readonly title: string;
  /** Navigates when set — the row's destination (a product's detail page, an invoice). */
  readonly to?: string;
  readonly description?: string;
  /**
   * `table` only — the row's middle columns. Absent falls back to a single
   * cell carrying `description`, so a row written before columns existed still
   * reads as a table.
   */
  readonly cells?: readonly ListModuleCell[];
  /** Generic leading visual — an icon component. */
  readonly leadingIcon?: Component;
  /** Generic leading visual — an image; wins over `leadingIcon` when both are given. */
  readonly leadingImageSrc?: string;
  readonly leadingImageAlt?: string;
  /** Generic trailing text — a price, a plan name, an instructor's name; whatever the row's own product shape needs. */
  readonly trailingText?: string;
  readonly trailingTone?: BadgeVariants["variant"];
  /**
   * An entity STATUS, as a badge in the trailing area — the named pair
   * `trailingText`/`trailingTone` only ever spelled loosely. Wins over
   * `trailingText` where both are given; every existing caller keeps working.
   */
  readonly status?: {
    readonly label: string;
    readonly tone: BadgeVariants["variant"];
  };
  /**
   * Standing FACTS about the row, beside its one status — a default card, one
   * that renews itself, one still unconfirmed. A status is where the row IS;
   * a tag is something that is also true of it.
   */
  readonly tags?: readonly {
    readonly label: string;
    readonly tone?: BadgeVariants["variant"];
    /**
     * Makes this tag a control — selecting it emits `select` with the value,
     * as every other control on the row does. Legacy's product rows opened
     * the label form from the `Ref:` tag itself (`cProdTags.vue:41-61`).
     */
    readonly action?: {
      readonly value: string;
      readonly label: string;
    };
  }[];
  /**
   * `compact`/`masonry`/`row-cards` only — the description is a SECRET: it
   * renders masked until revealed, and offers a copy control. The value
   * itself is `description`; the module never holds a second copy of it.
   */
  readonly secret?: boolean;
  /**
   * `compact`/`masonry`/`row-cards` only — a switch in the trailing area
   * (a relation switch, a delegate grant). Emits `value` on every change; the
   * module renders the state it was GIVEN and never latches its own.
   */
  readonly toggle?: {
    readonly value: string;
    readonly checked: boolean;
    /** Accessible name for the switch. No English default (CC22). */
    readonly label: string;
    /**
     * Why the switch cannot be moved right now. Present = the switch is
     * disabled and says so on hover; the reason IS the disabled state, so
     * there is no second flag to keep in step with it.
     */
    readonly disabledReason?: string;
  };
  /** A human-readable time label — rendered by the `timeline` variant and by the notifications dropdown. */
  readonly time?: string;
  /** The machine-readable datetime paired with `time`. */
  readonly datetime?: string;
  /**
   * `compact`/`masonry`/`table` only — an optional real control alongside the
   * item (e.g. "Book"), the same generic shape as `ButtonModuleAction`.
   * Selecting it emits `select` with this action's own value; the module
   * renders, it does not decide, matching the `button` module's own contract.
   */
  readonly action?: {
    readonly value: string;
    readonly label: string;
  };
  /** `cards`/`row-cards` only — a second, quieter control beside `action` (e.g. "Dismiss"). */
  readonly secondaryAction?: {
    readonly value: string;
    readonly label: string;
  };
  /**
   * A category chip beside the title — above it on a card ("Shared Hosting"),
   * before it in a compact row, where it is what makes a stack of rows read
   * as GROUPED by that chip (the dashboard's products by service identifier).
   */
  readonly category?: string;
  /** A row whose subject is over — cancelled, closed — reads dimmed, its title struck through. */
  readonly isInactive?: boolean;
  /** `compact`/`table`/`row-cards` — the row's overflow menu, behind an icon-only trigger. */
  readonly moreActions?: readonly {
    readonly value: string;
    readonly label: string;
    /** Why this entry cannot be chosen — present disables it, as `ButtonModuleAction.disabledReason` does. */
    readonly disabledReason?: string;
  }[];
  /**
   * `timeline` only — this row continues the run the row above it started, so
   * its title is not repeated. Legacy's ticket thread grouped consecutive
   * messages from one author under a single name (`ticketMessages.vue`); the
   * run is a fact about the DATA, so the selector computes it and the module
   * renders it.
   */
  readonly groupWithPrevious?: boolean;
};

/** `cards` only — the media block's shape. A grid of sessions and a grid of product tiles want different ones. */
export const LIST_MODULE_MEDIA = {
  VIDEO: "video",
  SQUARE: "square",
  PORTRAIT: "portrait",
  /** A fixed-height letterbox strip (the Host·Grid render's 144px setup-card art) — width-independent, unlike the ratio shapes. */
  BANNER: "banner"
} as const;

export type ListModuleMedia =
  (typeof LIST_MODULE_MEDIA)[keyof typeof LIST_MODULE_MEDIA];

export type ListModuleProps = {
  readonly variant: ListModuleVariant;
  readonly items: readonly ListModuleItem[];
  /**
   * `masonry` only — pins `ListRoot`'s CSS column count at every breakpoint,
   * overriding its own viewport-keyed `sm:`/`lg:` default for a call site
   * narrower than the viewport itself (ui-gaps.md). Unset keeps `ListRoot`'s
   * default.
   */
  readonly columns?: ListModuleColumns;
  /**
   * `table` only — the header row, in render order: the title column, then one
   * per cell, then the trailing and action columns the rows carry. Absent
   * renders no header at all. No English default (CC22).
   */
  readonly headings?: readonly ListModuleHeading[];
  /** Empty-state heading when `items` is empty (AC6.4). No English default (CC22). */
  readonly emptyTitle: string;
  readonly emptyDescription?: string;
  /** The empty state's icon-well glyph. Absent = a generic inbox. */
  readonly emptyIcon?: Component;
  /**
   * The one thing to DO when there is nothing to show — legacy put its "Place
   * new order" here. Absent renders the placeholder alone.
   */
  readonly emptyAction?: {
    readonly value: string;
    readonly label: string;
  };
  /** Renders at most this many rows — a dashboard SUMMARY caps itself, its View-all action carrying the rest. Absent = every item. */
  readonly maxItems?: number;
  /**
   * The Show-all control's labels under a `maxItems` cap — the same pair the
   * `spec` module carries. Absent renders no control, so a summary whose rest
   * lives elsewhere still caps silently. No English default (CC22).
   */
  readonly showMoreLabel?: string;
  readonly showLessLabel?: string;
  /**
   * `compact`/`masonry` only — stacks the rows under their own `category`,
   * each group headed by that label with a collapse toggle. Legacy's dashboard
   * grouped a client's products this way (`cProdsByGroup.vue`); a grouped row
   * drops its own category chip, since the header above it already says so.
   */
  readonly grouped?: boolean;
  /** `cards` only — the media block's shape. */
  readonly media?: ListModuleMedia;
  /** `row-cards` only — accessible name for each row's icon-only overflow trigger. No English default (CC22). */
  readonly moreLabel?: string;
  /** Accessible name for a secret row's reveal control. No English default (CC22). */
  readonly revealLabel?: string;
  /** Accessible name for a row's copy control. No English default (CC22). */
  readonly copyLabel?: string;
};

export type ListModuleEmits = {
  select: [value: string];
};
