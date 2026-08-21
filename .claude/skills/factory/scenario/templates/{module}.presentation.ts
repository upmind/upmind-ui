// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and the one built page it
 * cites. Authority:
 * `playgrounds/labs-nuxt/modules/scenarios/runtime/scenario.types.ts`
 * and `code-ui.companion.md` (Uischema/JSONForms — every element MUST carry an
 * `i18n` property; mandatory and non-negotiable). A disagreement between the
 * skeleton, the reference page and the doctrine is a surfaced finding, never
 * silently resolved toward either.
 *
 * Emitted by the DEVELOPER seat, beside `module.scenario.ts`.
 */

import { RuleEffect } from "@jsonforms/core";
import { ActionPlacementTypes, CardSlotTypes } from "../runtime/scenario.types";
import type {
  ActionsUischema,
  CardUischema,
  TableUischema
} from "../runtime/scenario.types";

// -----------------------------------------------------------------------------
/**
 * @module scenarios/useModules/module.presentation
 * @description How a module row DRAWS — the whole table, the same row as a
 * card, and every action's presentation and precondition. Grounded field by
 * field on the record `useModules().useContext().data` publishes (the module's
 * own `module.mappers.ts`), so nothing here describes a shape the composable
 * does not produce.
 *
 * A column exists because it was DECLARED, never because a key happened to be
 * on the row: a system id, a duplicate of another field, an always-empty field
 * and a server-fixed deprecated const are excluded by never being declared,
 * while the binding's `identifier` keeps the id functionally available.
 *
 * @reference `playgrounds/labs-nuxt/modules/scenarios/` — the one built page.
 */

/**
 * The WHOLE table: this one element list gives the header row (each element's
 * `i18n`), the column order, every cell's renderer, and the column picker's
 * DEFAULT visible set. The picker's OPTIONS are wider — every field of the
 * mapped record is offerable — so a field left out here is still switchable on.
 *
 * Each element's `type` names a real registered renderer with its own
 * `uiTypeIs` tester and carries `scope` + `i18n`: a date draws through
 * `TableCellDate`, a boolean group under `meta` through `TableCellBadges`, a
 * single boolean drawn filled-or-outline through `TableCellIcon`, everything
 * else through `TableCellText`. There is no options-discriminator and no cell
 * enum — the uischema reads as what it draws.
 */
export const tableUischema: TableUischema = {
  type: "TableLayout",
  elements: [
    { type: "TableCellText", scope: "#/properties/name", i18n: "text.name" },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/createdAt",
      i18n: "text.date_created"
    },
    {
      type: "TableCellIcon",
      scope: "#/properties/meta/properties/isDefault",
      i18n: "text.default_label"
    }
  ]
};

/**
 * The SAME record, drawn as a card — a second declaration, never a second
 * component. The card's one extra channel is the SLOT a field sits in, which is
 * the only fact a card carries that a table row does not.
 */
export const cardUischema: CardUischema = {
  type: "VerticalLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/name",
      i18n: "text.name",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/createdAt",
      i18n: "text.date_created",
      options: { slot: CardSlotTypes.SUBTITLE }
    }
  ]
};

/**
 * ONE actions channel, drawn identically on a table row and on a card — naming
 * it after one surface was the mistake a single list corrects.
 *
 * Each `name` is THE CAPABILITY THE CONTROL PERFORMS — a live member of
 * `useModules().useActions()` — never the dialog it happens to open. A scenario
 * step names the capability, and the step is a PRESS: it runs this control's own
 * closure so the editor opens, the fields fill and the save fires ON SCREEN. Name
 * a control `add` for a composable whose action is `ensure` and no step can find
 * it, so the replay reaches past the screen and only the data moves — the exact
 * cosplay the stage seam exists to end (operator ruling 2026-08-13).
 *
 * `handoff` is separate and orthogonal: it names the EDITOR this control opens
 * when a bare click could never supply what the capability needs (an address, a
 * whole form). The capability is still the `name`.
 *
 * Each `rule` is a real JSONForms rule evaluated against the ROW, so a per-row
 * capability the record itself carries gates the control declaratively: DISABLE
 * where the row is worth showing as refused, HIDE where the control has nothing
 * left to offer.
 *
 * The create control names no row — a record that does not exist yet has none to
 * read — which is what makes it the collection's own.
 */
export const actionsUischema: ActionsUischema = [
  {
    // NAMED FOR THE CAPABILITY, not the dialog: whatever `useModules()`
    // actually exposes to create a record — `ensure`, `create`, `add`. The
    // handoff below is the editor it opens; the name is what it DOES.
    name: "{createAction}",
    i18n: "action.add_new",
    icon: "plus",
    color: "primary",
    variant: "solid",
    placement: ActionPlacementTypes.HEADER,
    handoff: "add"
  },
  {
    name: "edit",
    i18n: "action.edit",
    icon: "edit-01",
    variant: "outline",
    placement: ActionPlacementTypes.VISIBLE,
    handoff: "edit"
  },
  {
    name: "remove",
    i18n: "action.remove",
    icon: "trash-01",
    color: "danger",
    variant: "outline",
    placement: ActionPlacementTypes.VISIBLE,
    feedback: {
      success: "confirm.module_removed",
      failure: "error.module_delete_failed"
    },
    rule: {
      effect: RuleEffect.DISABLE,
      condition: {
        type: "LEAF",
        scope: "#/properties/meta/properties/canDelete",
        expectedValue: false
      }
    }
  },
  {
    name: "setDefault",
    i18n: "action.set_as_default",
    icon: "star-01",
    variant: "outline",
    placement: ActionPlacementTypes.OVERFLOW,
    feedback: {
      success: "confirm.module_set_default",
      failure: "error.module_set_default_failed"
    },
    rule: {
      effect: RuleEffect.HIDE,
      condition: {
        type: "LEAF",
        scope: "#/properties/meta/properties/isDefault",
        expectedValue: true
      }
    }
  }
];
