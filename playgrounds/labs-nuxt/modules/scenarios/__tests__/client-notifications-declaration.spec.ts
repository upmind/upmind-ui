// -----------------------------------------------------------------------------
/**
 * @fileoverview client-notifications declaration — the binding claim the
 * scenario makes
 *
 * ## Job To Be Done
 * A scenario declares WHAT it boots, HOW it draws, and WHICH module it tracks.
 * This spec asserts that claim against the declared surface: every column
 * draws through a registered cell renderer, the card is actually drawable
 * (every card element carries a slot), every action names a live composable
 * member or a declared handoff, no manager-only verb reaches the read-only
 * list, every control sits at the page header, every declared icon resolves
 * through the registered icon map, ruling B's no-filter/no-sort surface holds,
 * and the tracked module owns a committed feature.
 *
 * ## What Breaks If These Fail
 * The scenario boots with a column no renderer owns, a card that counts
 * elements but draws nothing because none carries a slot, an action nobody
 * handles, a manager verb declared on a port that cannot call it, or a module
 * identity that matches nothing — a page that looks intact and silently does
 * nothing.
 *
 * Negative controls:
 * `client-notifications-declaration.card-slot.must-fail.patch`.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ICON_MAP } from "../../../../../packages/client-vue/src/components/icon/icon-map";
import {
  ActionPlacementTypes,
  CardSlotTypes,
  type ScenarioAction,
  type TableCell
} from "../runtime/scenario.types";
import declaration from "../useClientNotifications/client-notifications.scenario";
import {
  every,
  filter,
  flatMap,
  includes,
  intersection,
  map,
  some,
  sortBy
} from "lodash-es";

// -----------------------------------------------------------------------------

const MODULE_ROOT = join(
  import.meta.dirname,
  "../../../../../packages/headless/src/modules",
  declaration.tracks ?? ""
);

const allCells = (): TableCell[] =>
  flatMap(
    filter(
      [
        declaration.presentation.table?.elements,
        declaration.presentation.card?.elements,
        declaration.presentation.detail?.elements
      ],
      Boolean
    ) as TableCell[][]
  );

const allActions = (): ScenarioAction[] =>
  declaration.presentation.actions?.elements ?? [];

const declaredHandoffs = (): string[] =>
  map(
    filter(allActions(), action => !!action.handoff),
    "handoff"
  ) as string[];

const declaredIcons = (): string[] => {
  const icons: string[] = [];
  if (declaration.presentation.icon) icons.push(declaration.presentation.icon);
  for (const action of allActions()) {
    if (action.icon) icons.push(action.icon);
  }
  return icons;
};

const CELL_RENDERERS = new Set([
  "TableCellText",
  "TableCellHtml",
  "TableCellDate",
  "TableCellIcon",
  "TableCellBadges"
]);

const ALLOWED_LIST_ACTIONS = new Set(["destroy", "isReady", "refresh"]);

const MANAGER_VERBS = [
  "selectAll",
  "clearAll",
  "revert",
  "update",
  "toggle",
  "input",
  "isAllSelected"
];

const FILTER_OR_SORT_PATTERN = /filter|sort/i;

// -----------------------------------------------------------------------------

describe("the declaration binds composables", () => {
  it("names at least one of useList / useMutate", () => {
    expect(!!declaration.useList || !!declaration.useMutate).toBe(true);
  });

  it("declares useList and useMutate", () => {
    expect(declaration.useList).toBeDefined();
    expect(declaration.useMutate).toBeDefined();
  });

  it("declares no route — the directory IS the route", () => {
    expect((declaration as Record<string, unknown>).route).toBeUndefined();
  });
});

describe("the declaration's renderers draw only registered cell types", () => {
  it("draws every column through a registered cell renderer", () => {
    const cells = allCells();
    expect(cells.length).toBeGreaterThan(0);
    expect(every(cells, cell => CELL_RENDERERS.has(cell.type))).toBe(true);
  });
});

describe("the card is drawable", () => {
  it("every card element carries options.slot", () => {
    const cardElements = declaration.presentation.card?.elements ?? [];
    expect(cardElements.length).toBeGreaterThan(0);
    expect(every(cardElements, cell => !!cell.options?.slot)).toBe(true);
  });

  it("at least one card element is the TITLE slot", () => {
    const slots = map(declaration.presentation.card?.elements, "options.slot");
    expect(some(slots, slot => slot === CardSlotTypes.TITLE)).toBe(true);
  });
});

describe("the declaration's controls", () => {
  it("declares at least one action", () => {
    expect(allActions().length).toBeGreaterThan(0);
  });

  it("every handoff action names a declared handoff key", () => {
    const handoffKeys = Object.keys(declaration.handoff ?? {});
    expect(every(declaredHandoffs(), key => includes(handoffKeys, key))).toBe(
      true
    );
  });

  it("the handoff-bearing controls are the per-row editor and the account-wide manager", () => {
    const handoffActions = filter(allActions(), action => !!action.handoff);
    expect(sortBy(map(handoffActions, "name"))).toEqual(["editRow", "manage"]);
  });
});

describe("the declaration's controls are callable", () => {
  it("every action with no handoff and no detail names a member of the collection's published surface", () => {
    const plainActions = filter(
      allActions(),
      action => !action.handoff && !action.detail
    );
    expect(
      every(plainActions, action => ALLOWED_LIST_ACTIONS.has(action.name))
    ).toBe(true);
  });
});

describe("no manager verb reaches the list", () => {
  it("declares no manager-only verb among its actions", () => {
    expect(intersection(map(allActions(), "name"), MANAGER_VERBS)).toEqual([]);
  });
});

describe("the per-row editor is the only row-placed control", () => {
  it("places only the per-row editor on the row — every other control is at the header", () => {
    const rowActions = filter(
      allActions(),
      action => action.placement === ActionPlacementTypes.VISIBLE
    );
    expect(map(rowActions, "name")).toEqual(["editRow"]);
    expect(
      every(
        filter(allActions(), action => action.name !== "editRow"),
        action => action.placement === ActionPlacementTypes.HEADER
      )
    ).toBe(true);
  });
});

describe("every declared icon resolves through the registered icon map", () => {
  it("declares at least one icon", () => {
    expect(declaredIcons().length).toBeGreaterThan(0);
  });

  it("every declared icon — the page glyph and each control — is a key of ICON_MAP", () => {
    expect(every(declaredIcons(), name => name in ICON_MAP)).toBe(true);
  });
});

describe("ruling B is visible — no filter or sort surface", () => {
  it("persistCriteria is undefined — there is no filter or sort criteria to persist", () => {
    expect(
      (declaration as Record<string, unknown>).persistCriteria
    ).toBeUndefined();
  });

  it("declares no filter or sort element anywhere in the presentation", () => {
    const cellHits = filter(
      allCells(),
      cell =>
        FILTER_OR_SORT_PATTERN.test(cell.scope) ||
        FILTER_OR_SORT_PATTERN.test(cell.i18n)
    );
    const actionHits = filter(
      allActions(),
      action =>
        FILTER_OR_SORT_PATTERN.test(action.name) ||
        FILTER_OR_SORT_PATTERN.test(action.i18n)
    );
    expect([...cellHits, ...actionHits]).toEqual([]);
  });
});

describe("the declaration tracks a module with a committed feature", () => {
  it("names a module under packages/headless/src/modules", () => {
    expect(declaration.tracks).toBe("client-notifications");
    expect(existsSync(MODULE_ROOT)).toBe(true);
  });

  it("that module has a colocated .feature file", () => {
    const testDir = join(MODULE_ROOT, "__tests__");
    const feature = readdirSync(testDir).find(file =>
      file.endsWith(".feature")
    );
    expect(feature).toBeDefined();
  });

  it("the feature file tags at least one scenario", () => {
    const featurePath = join(
      MODULE_ROOT,
      "__tests__/client-notifications.feature"
    );
    const content = readFileSync(featurePath, "utf-8");
    expect(content).toContain("@AC-");
  });
});
