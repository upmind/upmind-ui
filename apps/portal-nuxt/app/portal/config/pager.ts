// -----------------------------------------------------------------------------
/**
 * @module portal/config/pager
 * @description The builders the page compositions share: the pager footer
 * (plan §2 pager wiring), fed by the collection's pager-state ref; the control
 * band under a panel's description — search left, filters and order right; the
 * brand's own note above a page; and a detail page's way back. A ref with no
 * mapping (detail sub-lists, dashboard recents) gets no pager and no band; the
 * pager also self-hides while its collection fits one page.
 */

import { ROW_LAYOUT, ROW_SURFACE } from "../content/types";
import {
  PAGER_REF_BY_ITEMS_REF,
  CONTROLS_REF_BY_ITEMS_REF,
  dataRef
} from "../mock/data-refs";
import { BUTTON_MODULE_VARIANT } from "../modules/button/types";
import { LIST_CONTROLS_CONCERN } from "../modules/list-controls/types";
import { PROSE_MODULE_VARIANT } from "../modules/prose/types";
import { ArrowLeft } from "lucide-vue-next";
import {
  BUTTON_MODULE_ID,
  PAGINATION_MODULE_ID,
  PROSE_MODULE_ID,
  TABS_MODULE_ID,
  LIST_CONTROLS_MODULE_ID,
  moduleGroup,
  moduleRef
} from "../registry";
import { GROUP_AXIS } from "../types";
import { compact } from "lodash-es";
import type { ContentRowConfig, RowHeaderControls } from "../content/types";
import type { DataRefId } from "../mock/data-refs";
import type { ListControlsConcern } from "../modules/list-controls/types";
import type { SlotAssignment } from "../types";

/**
 * The brand's own words at the top of a page — one client-area template slot
 * (plan R12), rendered as clamped markdown and absent where the brand wrote
 * nothing into that slot.
 */
export function brandNoteRow(
  markdownRef: DataRefId,
  presenceRef: DataRefId
): ContentRowConfig {
  return {
    layout: ROW_LAYOUT.FULL,
    // A muted surface, so the brand's words read as a note ABOUT the page
    // rather than as the page's own opening copy.
    surface: ROW_SURFACE.MUTED,
    visible: dataRef(presenceRef),
    slots: [
      moduleRef(PROSE_MODULE_ID, {
        variant: PROSE_MODULE_VARIANT.MARKDOWN,
        props: {
          markdown: dataRef(markdownRef),
          lines: 4,
          showMoreLabel: "Read more",
          showLessLabel: "Show less",
          emptyTitle: "No message"
        }
      })
    ]
  };
}

/**
 * The way back from a page ABOUT one entity, for the page's `breadcrumb` slot.
 * A detail route serves no pillar rail (`config/areas/detail.ts`), so this one
 * link is the whole navigation out — an arrow before the label, never after,
 * because it leads the reader backwards rather than onwards.
 *
 * `to` takes a data ref where the destination is the ROUTE's (a product's own
 * group), and a literal where the section is fixed.
 */
export function backLink(label: string, to: unknown): SlotAssignment {
  return moduleRef(BUTTON_MODULE_ID, {
    variant: BUTTON_MODULE_VARIANT.SINGLE,
    props: { label, tone: "link", size: "xs", icon: ArrowLeft, to }
  });
}

export function pagerFooter(
  title: string,
  itemsRef: DataRefId
): SlotAssignment | undefined {
  const pagerRef = PAGER_REF_BY_ITEMS_REF[itemsRef];
  if (pagerRef === undefined) return undefined;
  return moduleRef(PAGINATION_MODULE_ID, {
    props: { state: dataRef(pagerRef), label: `${title} pages` }
  });
}

/**
 * A status rail for a panel — legacy's per-status routes, as query state under
 * the title they filter. It rides the far edge of the control band's `end`
 * position; the row body was never an option, since a FULL row serves only its
 * first slot (`ROW_SLOT_NAMES`).
 */
export function statusRail(tabsRef: DataRefId, statusRef: DataRefId) {
  return moduleRef(TABS_MODULE_ID, {
    variant: "segmented",
    props: {
      tabs: dataRef(tabsRef),
      selected: dataRef(statusRef),
      emptyTitle: "No filters"
    }
  });
}

/** One half of a panel's controls, against the collection's own control-state ref. An items ref with no mapping gets none, exactly as `pagerFooter` treats an unpaged list. */
function panelControl(
  itemsRef: DataRefId,
  concern: ListControlsConcern,
  noun: string,
  searchPlaceholder: string
): SlotAssignment | undefined {
  const controlsRef = CONTROLS_REF_BY_ITEMS_REF[itemsRef];
  if (controlsRef === undefined) return undefined;
  return moduleRef(LIST_CONTROLS_MODULE_ID, {
    props: {
      state: dataRef(controlsRef),
      concern,
      searchPlaceholder,
      searchLabel: `Search ${noun}`,
      sortLabel: `Sort ${noun}`
    }
  });
}

/** A lone member stands bare rather than wearing a group of one; nothing at all stays undefined. */
function controlCluster(
  ...members: readonly (SlotAssignment | undefined)[]
): SlotAssignment | undefined {
  const present = compact(members);
  const first = present.at(0);
  if (first === undefined) return undefined;
  if (present.length === 1) return first;
  return moduleGroup(GROUP_AXIS.HORIZONTAL, present);
}

/**
 * A panel's control band (`RowHeaderControls`): the search field and the
 * filters on the left, then the order, the view switch and the status rail on
 * the right, the rail on the far edge where a tab bar reads as the list's own
 * heading. Every piece degrades on its
 * own — a panel with no controls mapping keeps its rail, a collection declaring
 * no sort options renders no select — so one builder serves every panel and the
 * absent pieces simply do not appear.
 */
export function panelControls(
  itemsRef: DataRefId,
  noun: string,
  searchPlaceholder: string,
  rail?: SlotAssignment
): RowHeaderControls | undefined {
  const control = (concern: ListControlsConcern) =>
    panelControl(itemsRef, concern, noun, searchPlaceholder);
  // What NARROWS the set reads left, what re-presents it reads right. Every
  // concern is mounted whatever the panel declares: an instance whose state
  // carries nothing for it renders nothing at all.
  const start = controlCluster(
    control(LIST_CONTROLS_CONCERN.SEARCH),
    control(LIST_CONTROLS_CONCERN.FILTERS)
  );
  const end = controlCluster(
    control(LIST_CONTROLS_CONCERN.SORT),
    control(LIST_CONTROLS_CONCERN.VIEW),
    rail
  );
  if (start === undefined && end === undefined) return undefined;
  return { start, end };
}
