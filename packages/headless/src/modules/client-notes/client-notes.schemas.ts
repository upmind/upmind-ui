/** @internal */

import { SortDirection } from "../query/query.types";
import type { LookupItem } from "../lookup";
import type { ProductLookupService } from "./client-notes.types";
import type { QuerySchema } from "../query/query.types";
import type {
  ControlElement,
  JsonSchema7,
  UISchemaElement
} from "@jsonforms/core";
// -----------------------------------------------------------------------------
/**
 * @module client-notes/client-notes.schemas
 * @description Schema / uischema for the per-asset form, and the collection's
 * query schema family. They move as PAIRS: a schema field with no control
 * renders a required-but-invisible input.
 *
 * WARNING: Do not import directly. The manager's machine config adopts the
 * form pair (`setSchemas`) and consumers read it off
 * `useClientNoteManager().useContext().schema` / `.uischema` — the barrel
 * exports neither (`@decision` D7, `index.ts`).
 */

/**
 * The criteria model path the lookup control's typed term writes — the property
 * `useLookup` merges on `search(term)`. A top-level `query` string (NOT a
 * `filters` branch): the backend's dedicated quick-search, which
 * `translateQuery` emits as a bare `query=<term>`. `useProductLookupSchema`
 * declares exactly this property.
 */
export const PRODUCT_SEARCH_SCOPE = "query";

/**
 * The criteria schema for the async contract-product lookup — the whole request
 * state (`query` quick-search + `pagination`) as ONE Draft-07 schema over
 * {@link ProductLookupQueryModel}. `filter[clients.id]` is a fixed URL scope,
 * not a criteria branch (`client-notes.services.ts`); the typed term writes the
 * top-level `query` property. Verified against the legacy oracle: its picker
 * (`selectContractProductsModal.vue` → `cprods-listing`) drives the free-text
 * search through `QuickSearchFilter()` (`key: "query"`, vue-app
 * `data/filters/contractProducts.ts:464`), which the backend expands across
 * service name / product name / identifier — a bare `query=<term>` param, never
 * a `filter[...]`.
 */
export function useProductLookupSchema(): JsonSchema7 {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      query: {
        type: ["string", "null"],
        title: "Search",
        minLength: 1
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 1, default: 20 },
          offset: { type: "integer", minimum: 0, default: 0 }
        }
      }
    }
  } satisfies JsonSchema7;
}

/**
 * The per-asset form schema. `label` is required ONLY when `encrypted` is
 * true — the oracle's `v-if="isSecret"` required label
 * (`updateVaultAssetModal.vue:18-31`). `visible_for_client` is present on the
 * model (it drives `VaultAsset.meta.isHiddenFromClient`) but `readOnly: true`
 * for this cell — the oracle's control is `v-if="isAdmin"` (row S3, a client
 * cannot write it).
 */
export const useSchema = ({
  encrypted
}: {
  encrypted?: boolean;
}): JsonSchema7 => {
  const schema: JsonSchema7 = {
    type: "object",
    title: "Vault Asset",
    required: encrypted ? ["note", "label"] : ["note"],
    properties: {
      id: {
        type: ["string", "null"],
        title: "ID",
        readOnly: true
      },
      note: {
        type: "string",
        title: "Note"
      },
      label: {
        type: ["string", "null"],
        title: "Label"
      },
      encrypted: {
        type: "boolean",
        title: "Secret",
        readOnly: false
      },
      // `pinned` is deliberately ABSENT from the editor schema (AC-37): the
      // editor offers no pin control, because pinning is a LIST action
      // (`setPinned`) and the legacy vault forms carry no pin field, setting
      // `pinned` only at create time (`mapVaultAssetCreate` hardcodes `false`;
      // `mapVaultAssetUpdate` excludes it). A property in the schema is a field
      // the form offers, so a `pinned` the save PUT never carries must not be
      // one.
      //
      // A plain nullable string — the product list is NO LONGER embedded. The
      // async lookup rides the uischema control's `options.lookup.service`
      // (design.md §Layer 3); the schema carries only the scalar FK.
      contract_product_id: {
        type: ["string", "null"],
        title: "Linked product"
      },
      visible_for_client: {
        type: "boolean",
        title: "Visible to client",
        readOnly: true
      }
    }
  };

  return schema;
};

/**
 * The per-asset form uischema. Renders the label control ONLY when
 * `encrypted` — the pair moves together.
 *
 * @decision (R4 / row M12 / AC-37)
 * what: renders NO `#/properties/pinned` control, and the schema declares no
 *   `pinned` property either.
 * why: the oracle's edit form omits `pinned`; pinning is a LIST action
 *   (`useClientNotes().useActions().setPinned`, row C18). A schema property is
 *   a field the form offers, and the edit save PUT never carries `pinned`
 *   (`mapVaultAssetUpdate` excludes it), so keeping the property offered a
 *   control the save would drop. Create-time `pinned: false` is set by
 *   `mapVaultAssetCreate` directly, not off a form field.
 * rejected: keeping the property (`readOnly` or otherwise) — the oracle
 *   exposes no such field, so any form-visible `pinned` invents capability.
 *
 * @decision (defect fix — operator screenshot)
 * what: renders `#/properties/encrypted` ONLY when `isNew`.
 * why: without a control a client cannot CREATE a secret. An existing
 *   record's flip is owned by `useActions().convert` (D11), whose label-less
 *   refusal is typed (`vault_asset_label_required`); an edit-time control
 *   opens a second, worse path.
 * rejected: an edit-time control (two paths to one flip); a `readOnly` toggle
 *   (reads as writable when it is not).
 */
export const useUischema = ({
  encrypted,
  isNew,
  lookupService,
  currentProduct
}: {
  encrypted?: boolean;
  isNew?: boolean;
  lookupService?: ProductLookupService;
  currentProduct?: LookupItem;
}): UISchemaElement => {
  const elements: UISchemaElement[] = [];

  if (isNew) {
    elements.push({
      type: "Control",
      scope: "#/properties/encrypted",
      i18n: "form.secret",
      options: { format: "switch" }
    });
  }

  elements.push({
    type: "Control",
    scope: "#/properties/note",
    i18n: "form.note",
    options: { autoFocus: !encrypted, multi: true }
  });

  if (encrypted) {
    elements.push({
      type: "Control",
      scope: "#/properties/label",
      i18n: "form.label",
      options: { autoFocus: true }
    });
  }

  elements.push({
    type: "Lookup",
    scope: "#/properties/contract_product_id",
    i18n: "form.contract_product",
    // The async lookup rides here as a live reference (the `options.manage`
    // pattern) — a thunk, so a `JSON` round-trip drops it cleanly rather than
    // throwing on the query handle's circular reactive refs. `current` seeds
    // the linked product's label so it shows before any search (AC7).
    options: {
      lookup: {
        service: lookupService,
        searchScope: PRODUCT_SEARCH_SCOPE,
        current: currentProduct
      },
      placeholder: "Select a product…"
    }
  } as UISchemaElement);

  return { type: "VerticalLayout", elements } as UISchemaElement;
};

// -----------------------------------------------------------------------------

/**
 * The collection's QUERY schema — filters · sort · pagination as ONE Draft-07
 * schema over one model. A self-contained JSON literal (liftable into ajv or a
 * test and run standalone).
 *
 * @decision
 * what: `filters.encrypted.eq` emits `filter[encrypted|eq]`, not suffix-less
 *   `filter[encrypted]`.
 * why: the translator (`query/query.utils.ts:503-530`) emits `filter[col|op]`
 *   for any branch declaring `properties: { eq }`; the two forms are the same
 *   query. Gated by AC-31 against a staging fixture.
 * rejected: a bare `filters.encrypted` branch — the fallback if the capture
 *   rejects the suffixed form; the suffixed form is already proven on this API.
 *
 * @decision D9
 * what: `filters.encrypted.eq` is `["boolean","null"]` (tri-state, like
 *   `pinned.eq`), not the bare `"boolean"` design.md §6.1 specified.
 * why: a bare boolean leaf is coerced to `false` by shared `useModelParser`,
 *   so EVERY request carried a spurious `filter[encrypted|eq]=0` — narrowing to
 *   notes-only by default (AC-4). Allowing `null` leaves an untouched `eq`
 *   absent; a concrete `true`/`false` write is unaffected.
 * rejected: fixing `useModelParser` — shared, strict-for-forms by design, out
 *   of this module's lane.
 *
 * @decision D2
 * what: the `sort` branch declares `label`/`pinned`/`created_at` with NO
 *   `default` and NO `minItems`.
 * why: the oracle deletes `params.order` and lets the BE apply pinned ordering
 *   (`vaultProvider.vue:162-165`); a default would OVERRIDE it (a regression).
 *   Declared (not omitted) because the D15 gate halts on an absent sort member.
 * rejected: omitting the branch (halts D15); defaulting to `pinned DESC`
 *   (invents an order the oracle never sends).
 *
 * `pagination.limit` defaults to 3 — the live per-section value
 * (`clientNotesComp.vue:68`), not the sibling `0`: the vault is genuinely paged.
 *
 * @decision (X9 / AC-42 / AC3)
 * what: `filters.contract_product_id.eq` is an operator-bearing branch
 *   (`properties: { eq }`, so `filter[contract_product_id|eq]` reaches the
 *   wire) whose `eq` is a plain nullable string — NO embedded `enum`/`options`
 *   product list.
 * why: the async lookup replaces the embedded list; the filter control's
 *   members come from its `options.lookup.service` (the live reference), not
 *   the schema (design.md §Layer 3). The wire branch is preserved so a
 *   selection still narrows the list with `filter[contract_product_id|eq]`
 *   (AC3). The oracle's `filter[contract_product_id]` was route-scoped, never
 *   client-operated, so exposing it is capability-increasing, no sign-off.
 * rejected: embedding `enum` + `options` from an eager list — the story's whole
 *   point is to stop embedding the product list (does not scale).
 */
export function useQuerySchema(): QuerySchema {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          encrypted: {
            type: "object",
            title: "Secret",
            additionalProperties: false,
            properties: {
              // Tri-state like `pinned.eq` (D9): `null`/absent is the
              // "show everything" clear position, never coerced to `false`.
              eq: {
                type: ["boolean", "null"],
                enum: [true, false, null]
              }
            }
          },
          label: {
            type: "object",
            title: "Label",
            additionalProperties: false,
            properties: {
              // The bare term — the translator adds the % wildcards.
              like: { type: ["string", "null"], minLength: 1 }
            }
          },
          pinned: {
            type: "object",
            title: "Pinned",
            additionalProperties: false,
            properties: {
              // `null` is a MEMBER, not an absence — the clear position
              // (client-address.schemas.ts:381-389 precedent).
              eq: {
                type: ["boolean", "null"],
                enum: [true, false, null]
              }
            }
          },
          contract_product_id: {
            type: "object",
            title: "Linked product",
            additionalProperties: false,
            properties: {
              // The operator-bearing branch (`properties: { eq }`) the
              // translator needs to emit `filter[contract_product_id|eq]` (AC3)
              // — same shape as `encrypted.eq`/`pinned.eq`. A plain nullable
              // string: the product list is NO LONGER embedded (no `enum`/
              // `options`); the async lookup rides the filter control's
              // `options.lookup.service` instead. `null` is the clear position.
              eq: { type: ["string", "null"] }
            }
          }
        }
      },
      sort: {
        type: "array",
        maxItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: { enum: ["label", "pinned", "created_at"] },
            dir: { enum: [SortDirection.ASC, SortDirection.DESC] }
          }
        }
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 0, default: 3 },
          offset: { type: "integer", minimum: 0, default: 0 }
        }
      }
    }
  } satisfies JsonSchema7;
}

/**
 * The module's DEFAULT filter-bar presentation over the one query schema —
 * FOUR controls, including the `encrypted` split (the JTBD's third
 * no-template-slot capability): without a rendered control here, the
 * playground page cannot demonstrate "one entity, a flag decides which".
 */
export function useQueryUischema(
  lookupService?: ProductLookupService
): UISchemaElement {
  return {
    type: "FilterBar",
    elements: [
      {
        type: "Control",
        scope: "#/properties/filters/properties/label/properties/like",
        i18n: "form.vault_asset_search",
        options: {
          format: "search",
          icon: "search-md",
          noLabel: true,
          optionalText: ""
        }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/encrypted/properties/eq",
        i18n: "form.vault_asset_type",
        options: { format: "toggle-group", noLabel: true, optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/pinned/properties/eq",
        i18n: "form.pinned_filter",
        options: { format: "toggle-group", noLabel: true, optionalText: "" }
      },
      {
        type: "Lookup",
        scope:
          "#/properties/filters/properties/contract_product_id/properties/eq",
        i18n: "form.contract_product_filter",
        // The async lookup rides here as a live reference (a thunk — JSON-safe),
        // the SAME service the editor's select uses (design.md §Layer 3). No
        // embedded options list.
        options: {
          lookup: {
            service: lookupService,
            searchScope: PRODUCT_SEARCH_SCOPE
          },
          noLabel: true,
          optionalText: ""
        }
      }
    ]
  } as UISchemaElement;
}

/**
 * The collection's ORDERING presentation — one element over the query
 * schema's `sort` branch (the scenario lane's D15 gate).
 */
export function useSortUischema(): ControlElement {
  return {
    type: "Control",
    scope: "#/properties/sort",
    i18n: "form.vault_asset_sort"
  };
}
