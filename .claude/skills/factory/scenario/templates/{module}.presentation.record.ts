// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and the built pages it
 * cites. Authority:
 * `playgrounds/labs-nuxt/modules/scenarios/runtime/scenario.types.ts`
 * (`RecordUischema`, `RecordActionDeclaration`, `RecordSectionDeclaration`) and
 * `playgrounds/labs-nuxt/modules/scenarios/docs/record.md`. Every element MUST
 * carry an `i18n` key (`code-ui.companion.md`). A disagreement between the
 * skeleton, a reference page and the doctrine is a surfaced finding, never
 * silently resolved toward either.
 *
 * Emitted by the DEVELOPER seat, beside `module.scenario.ts` (the record
 * variant, `{module}.scenario.record.ts`). Rows D26–D34 of the lane's
 * derivation contract fill every field below.
 */

import { ScopeActorTypes, useModules } from "@upmind-automation/headless";
import {
  RecordActionColorTypes,
  RecordActionPlacementTypes,
  TableColumnWidthTypes
} from "../runtime/scenario.types";
import { relatedSummary } from "../useRelated/related.summary";
import { moduleSummary } from "./module.summary";
import type { RecordUischema } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------
/**
 * @module scenarios/useModuleManager/module.presentation
 * @description How ONE module record DRAWS on the shared record surface — a
 * header, sections, and every write with where it sits. Grounded field by field
 * on the record the manager publishes (the module's own `module.mappers.ts`),
 * so nothing here describes a shape the composable does not produce.
 *
 * Nothing is guarded for emptiness: an absent value, an absent date, an empty
 * section and an unexposed action are not drawn. Layout is the surface's —
 * this file chooses content, never layout.
 */

/** The record, drawn whole. */
export const moduleRecord: RecordUischema = {
  type: "RecordLayout",
  // The context key holding the mapped record; `siblings` fold further keys
  // the manager publishes beside it into the same model.
  record: "module",
  siblings: ["title"],
  // D27 — title scope, ONE status, inline badges from the record's meta flags.
  header: {
    title: "#/properties/title",
    status: "#/properties/status/properties/name",
    badges: [{ flag: "isFlagged", i18n: "labs.module_meta_flagged" }]
  },
  sections: [
    // D28 — fields from the mapped record, each with a width; the shared
    // summary (D34) carries the identity fields every record shows.
    {
      kind: "fields",
      key: "details",
      i18n: "labs.record_details",
      icon: "icon-name",
      elements: [
        ...moduleSummary,
        {
          type: "TableCellText",
          scope: "#/properties/note",
          i18n: "text.note",
          options: { width: TableColumnWidthTypes.FULL }
        }
      ]
    },
    // D29 — embedded related records: ONE Section per item, no group heading,
    // body = the RELATED record's own shared summary, header link(s) = rowActions.
    {
      kind: "collection",
      key: "related",
      scope: "#/properties/related",
      rowTitle: ["#/properties/title", "#/properties/name"],
      rowIcon: "icon-name",
      row: relatedSummary,
      rowActions: [
        {
          name: "open",
          i18n: "labs.related_open",
          icon: "arrow-right",
          placement: RecordActionPlacementTypes.ROW,
          navigate: { route: "/useRelated/:id", idScope: "#/properties/id" }
        }
      ]
    }
    // D30 — a related LIST another composable owns, instead of an embedded one:
    // { kind: "collection", key, scope, row, source: { use, actor, context:
    //   { type: <that module's context enum member>, idScope: "#/properties/id" } } }
    // D31 — any other registered kind (`thread`, …) is declared here by `kind`.
  ],
  // D32 — every write, from the manager's live action map. FOOTER by default
  // (leave `placement` off); HEADER only as an operator-named exception.
  actions: [
    {
      // A form write: `run` is the manager's open transition, which fills the
      // context slot the form reads.
      name: "edit",
      i18n: "labs.module_edit",
      icon: "edit-01",
      gate: "canEdit",
      run: "openEdit",
      form: {
        context: "edit",
        set: "input",
        submit: "update",
        cancel: "clear",
        valid: "isValid",
        i18n: "labs.module_edit",
        submitI18n: "labs.module_edit_submit"
      }
    },
    {
      name: "remove",
      i18n: "action.remove",
      icon: "trash-01",
      color: RecordActionColorTypes.DANGER,
      gate: "canDelete",
      busy: "isRemoving",
      run: "remove"
    },
    {
      name: "setDefault",
      i18n: "action.set_as_default",
      icon: "star-01",
      placement: RecordActionPlacementTypes.OVERFLOW,
      gate: "!isDefault",
      run: "setDefault"
    },
    {
      name: "refresh",
      i18n: "action.refresh",
      icon: "refresh-cw-01",
      placement: RecordActionPlacementTypes.UTILITY,
      run: "refresh"
    },
    {
      name: "reset",
      i18n: "labs.module_reset",
      icon: "flip-backward",
      placement: RecordActionPlacementTypes.UTILITY,
      run: "reset"
    }
  ],
  // D33 — the owning collection's own picker form, so the bare url is useful.
  picker: {
    use: useModules,
    actor: ScopeActorTypes.SELF,
    schema: "schemas.modulePicker",
    field: "module",
    icon: "icon-name",
    i18n: {
      title: "labs.module_needs_id",
      text: "labs.module_needs_id_text",
      input: "labs.module_id_label",
      open: "labs.module_open"
    }
  }
};
