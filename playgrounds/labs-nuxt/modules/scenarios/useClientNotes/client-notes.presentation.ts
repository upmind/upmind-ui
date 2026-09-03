// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientNotes/client-notes.presentation
 * @description How a client vault asset DRAWS — the table, the same record as
 * a card, the read-only detail overlay, and every action's presentation and
 * precondition. Grounded field by field on the live row
 * `useClientNotes().useContext().data` publishes (`VaultAsset` in
 * `client-notes.types.ts`), so nothing here describes a shape the composable
 * does not produce.
 *
 * D6 exclusions from the table's DEFAULT visible set, echoed and never
 * silently re-added: `id` (system value, stays reachable through the
 * binding's default `id` identifier); `contractProduct` (`null` in every
 * recorded row — now surfaced in the detail overlay, where it reads as absent
 * until a row carries a link); `meta.isLinkedToProduct` (duplicate, always
 * `false`);
 * `editor` (always empty); `updatedAt` and `author` moved to the detail
 * overlay rather than dropped outright. The column picker still offers every
 * mapped field; this element list decides only the default set, header row,
 * order and renderers.
 *
 * The table and the detail overlay draw pinned, secret and `isHiddenFromClient`
 * through ONE shared badge set (`FLAG_BADGES`), so their status reads
 * identically — there are no separate pinned/secret columns. The card keeps its
 * TITLE-slot star/lock icons and draws only `isHiddenFromClient` as a badge.
 * `isLinkedToProduct` is a declared D9 gate flag but no drawn control in this
 * file needs it, consistent with it being observed always-false.
 *
 * `note` renders as `TableCellText`, per the derivation rule (not
 * `TableCellHtml`) — the disagreement between that renderer and the legacy
 * `u-markdown` treatment is RECORDED, not resolved toward piping an
 * unsanitised note body through an HTML cell.
 *
 * PENDING i18n — these keys are referenced below but do not yet exist in
 * `packages/i18n/src/core/*-en.json` (out of this seat's write lane for that
 * package): `text.pinned_label`, `text.secret_label`, `text.label`,
 * `text.note`, `text.hidden_from_client_label`, `text.revealed_label`,
 * `text.author`,
 * `text.date_updated`, `action.reveal`, `action.hide`, `action.convert`,
 * `action.toggle_pinned`, `confirm.vault_asset_saved`,
 * `confirm.vault_assets_refreshed`, `error.client_notes_refresh_failed`,
 * `confirm.vault_asset_revealed`, `error.client_notes_reveal_failed`,
 * `confirm.vault_asset_converted`, `error.client_notes_convert_failed`,
 * `confirm.vault_asset_pin_updated`, `error.client_notes_pin_failed`. Every
 * other `i18n:` reference below already resolves in the catalogue.
 *
 * ORDERING is not here at all: the collection is ordered by the query
 * schema's own `sort` enum (`["label","pinned","created_at"]`), which the
 * control reads directly.
 */

import { RuleEffect } from "@jsonforms/core";
import {
  ActionPlacementTypes,
  CardSlotTypes,
  TableColumnWidthTypes
} from "../runtime/scenario.types";
import type {
  ActionsUischema,
  CardUischema,
  DetailUischema,
  TableUischema
} from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/**
 * The card's status set — the ONE `meta` member D6 does not already surface
 * through the card's own TITLE-slot icons or exclude as a dead signal (see the
 * module docblock above). The card keeps its star/lock icons, so it draws only
 * `isHiddenFromClient` as a badge.
 */
const STATUS_BADGES = [
  {
    flag: "isHiddenFromClient",
    i18n: "text.hidden_from_client_label",
    color: "warning" as const
  }
];

/**
 * The status set the TABLE and the DETAIL overlay share — pinned and secret
 * drawn as their boolean state (a badge appears only when the flag is set),
 * each carrying its own icon, plus the shared `isHiddenFromClient` status.
 * One set, so the table's status column and the detail overlay read IDENTICALLY
 * (there are no separate pinned/secret columns any more — the badge is the
 * only place a flag is drawn on these two surfaces).
 */
const FLAG_BADGES = [
  {
    flag: "isPinned",
    i18n: "text.pinned_label",
    color: "warning" as const,
    icon: "star-01"
  },
  {
    flag: "isSecret",
    i18n: "text.secret_label",
    color: "neutral" as const,
    icon: "lock-01"
  },
  {
    // A secret whose plaintext is currently shown (`useContext().data` merged
    // it into `note` and flipped this flag) — the same state `reveal`/`hide`
    // toggle on this row.
    flag: "isRevealed",
    i18n: "text.revealed_label",
    color: "success" as const,
    icon: "lock-unlocked-01"
  },
  ...STATUS_BADGES
];

export const tableUischema: TableUischema = {
  type: "TableLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/label",
      i18n: "text.label"
    },
    {
      type: "TableCellText",
      scope: "#/properties/note",
      i18n: "text.note",
      options: { width: TableColumnWidthTypes.HALF }
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: { badges: FLAG_BADGES }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/createdAt",
      i18n: "text.date_added"
    }
  ]
};

/**
 * The SAME record, drawn as a card — a second declaration, never a second
 * component. Both flag icons ride the TITLE slot beside the label (the
 * manage/billing card's own law, `manage/Item.vue`), the badge alongside
 * them, the note body fills BODY, and the created date sits in SUBTITLE.
 */
export const cardUischema: CardUischema = {
  type: "CardLayout",
  elements: [
    {
      type: "TableCellIcon",
      scope: "#/properties/pinned",
      i18n: "text.pinned_label",
      options: { icon: "star-01", slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellIcon",
      scope: "#/properties/encrypted",
      i18n: "text.secret_label",
      options: { icon: "lock-01", slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/label",
      i18n: "text.label",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: { badges: STATUS_BADGES, slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/note",
      i18n: "text.note",
      options: { slot: CardSlotTypes.BODY }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/createdAt",
      i18n: "text.date_added",
      options: { slot: CardSlotTypes.SUBTITLE }
    }
  ]
};

/**
 * The SAME record drawn READ-ONLY in the detail overlay — a third
 * declaration over the row already in hand, drawn through the same cell
 * renderers the table uses. No `useDetail` accompanies it, so this is the
 * row-data path: the overlay shows what the list already holds, with no
 * fetch. Its field set EXCEEDS the table's default: `author` and `updatedAt`
 * land here rather than being dropped outright (D6 exclusion note above).
 *
 * NOTE — a revealed secret's plaintext DOES render here. `useContext().data`
 * merges `revealed[id]` back into each row's `note`, and the overlay re-reads
 * the LIVE row (`ListSurface`'s `detailRecord`, not a copy frozen at open time),
 * so the decrypted value shows in the detail exactly as it does in the table.
 * `reveal`/`hide` flip that value on the row. (`maskWhen`/`maskI18n` below is
 * declared intent only — no runtime cell consumes it yet.)
 */
export const detailUischema: DetailUischema = {
  type: "DetailLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/label",
      i18n: "text.label"
    },
    {
      type: "TableCellText",
      scope: "#/properties/note",
      i18n: "text.note",
      options: {
        // Same mask as the table: a secret reads "hidden" until revealed.
        maskI18n: "text.secret_hidden",
        maskWhen: "meta.isSecret"
      }
    },
    {
      type: "TableCellText",
      scope: "#/properties/contractProduct/properties/product_name",
      i18n: "form.contract_product.label"
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: { badges: FLAG_BADGES }
    },
    {
      type: "TableCellText",
      scope: "#/properties/author/properties/name",
      i18n: "text.author"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/createdAt",
      i18n: "text.date_added"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/updatedAt",
      i18n: "text.date_updated"
    }
  ]
};

/**
 * Every action the module offers, in the order they are drawn — ONE list for
 * the row and the card alike, with the collection's own control distinguished
 * by the only thing that differs: it is fired with no record, so it is
 * placed in the page header (G4).
 *
 * Each name is a live member of `useClientNotes().useActions()`, EXCEPT the
 * two handoff controls (`add`/`edit`) and the detail control (`view`) — none
 * of which is itself a live action on either half of this module (there is
 * no `ensure`/`create`/`add`/`edit`/`view`/`setDefault` capability on either
 * `useClientNotes` or `useClientNoteManager`). `add`/`edit`/`view` are named
 * for the SURFACE key they open rather than a capability, mirroring the
 * `usePersonalDetails` scenario's `editField` — the documented exception for
 * a control with no matching live member. The create control's own resolved
 * capability is `useClientNoteManager().useActions().update()`, called on a
 * `.fresh()` boot (no id in context) — the handoff, not this control's name,
 * is what makes that reachable, since a bare click supplies neither the note
 * body nor the encrypted/label pair (C1/C2).
 *
 * Each rule reads a flag the ROW itself carries, so the control state and the
 * business rule cannot disagree (C11). `remove` carries NO rule — the module
 * has no `meta.canDelete` (D9), and none is invented. `reveal`/`hide` are
 * both gated on `meta.isSecret`: neither capability applies to a plain note.
 */
export const actionsUischema: ActionsUischema = {
  type: "ActionsLayout",
  elements: [
    {
      type: "Action",
      name: "add",
      handoff: "add",
      i18n: "action.add_new",
      icon: "plus",
      variant: "primary",
      placement: ActionPlacementTypes.HEADER
    },
    {
      type: "Action",
      name: "view",
      detail: true,
      i18n: "action.view",
      icon: "eye",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE
    },
    {
      type: "Action",
      name: "edit",
      handoff: "edit",
      i18n: "action.edit",
      icon: "edit-01",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE
    },
    {
      type: "Action",
      name: "reveal",
      i18n: "action.reveal",
      icon: "lock-unlocked-01",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE,
      feedback: {
        success: "confirm.vault_asset_revealed",
        failure: "error.client_notes_reveal_failed"
      },
      // Reveal decrypts a secret that is not yet shown — SHOWN only when the row
      // is a secret AND is not currently revealed. Its pair is `hide` below.
      rule: {
        effect: RuleEffect.SHOW,
        condition: {
          scope: "#/properties/meta",
          schema: {
            properties: {
              isSecret: { const: true },
              isRevealed: { const: false }
            },
            required: ["isSecret", "isRevealed"]
          }
        }
      }
    },
    {
      type: "Action",
      name: "hide",
      i18n: "action.hide",
      icon: "lock-01",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE,
      // Hide re-hides a shown secret — SHOWN only when the row is a secret AND is
      // currently revealed. The exact complement of `reveal` above.
      rule: {
        effect: RuleEffect.SHOW,
        condition: {
          scope: "#/properties/meta",
          schema: {
            properties: {
              isSecret: { const: true },
              isRevealed: { const: true }
            },
            required: ["isSecret", "isRevealed"]
          }
        }
      }
    },
    {
      type: "Action",
      // The module's defining capability — note<->secret, the `encrypted`
      // flag. Unconditional: it fires in both directions from the same
      // control, and a label-less note's rejection is a runtime precondition
      // (D4 on `useClientNotes.actions.ts`), not a static row flag to gate on.
      name: "convert",
      i18n: "action.convert",
      icon: "switch-horizontal-01",
      variant: "outline",
      placement: ActionPlacementTypes.OVERFLOW,
      feedback: {
        success: "confirm.vault_asset_converted",
        failure: "error.client_notes_convert_failed"
      }
    },
    {
      type: "Action",
      // A one-arg TOGGLE (D10 on `useClientNotes.actions.ts`) — both pin and
      // unpin are this one control, so no rule hides it in either direction.
      name: "setPinned",
      i18n: "action.toggle_pinned",
      icon: "star-01",
      variant: "outline",
      placement: ActionPlacementTypes.OVERFLOW,
      feedback: {
        success: "confirm.vault_asset_pin_updated",
        failure: "error.client_notes_pin_failed"
      }
    },
    {
      type: "Action",
      name: "remove",
      i18n: "action.remove",
      icon: "trash-01",

      placement: ActionPlacementTypes.OVERFLOW,
      feedback: {
        success: "confirm.vault_asset_removed",
        failure: "error.client_notes_delete_failed"
      }
    },
    {
      type: "Action",
      name: "refresh",
      i18n: "action.refresh",
      icon: "refresh-cw-01",
      variant: "outline",
      placement: ActionPlacementTypes.OVERFLOW,
      feedback: {
        success: "confirm.vault_assets_refreshed",
        failure: "error.client_notes_refresh_failed"
      }
    }
  ]
};
