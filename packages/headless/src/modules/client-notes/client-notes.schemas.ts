/** @internal */

import { SortDirection } from "../query/query.types";
import type { QuerySchema } from "./client-notes.types";
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
      pinned: {
        type: "boolean",
        title: "Pinned"
      },
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
 * `encrypted` — the pair moving together (ARMS.md standing law).
 */
export const useUischema = ({
  encrypted
}: {
  encrypted?: boolean;
}): UISchemaElement => {
  const elements: UISchemaElement[] = [
    {
      type: "Control",
      scope: "#/properties/note",
      i18n: "form.note",
      options: { autoFocus: !encrypted }
    }
  ];

  if (encrypted) {
    elements.push({
      type: "Control",
      scope: "#/properties/label",
      i18n: "form.label",
      options: { autoFocus: true }
    });
  }

  elements.push(
    {
      type: "Control",
      scope: "#/properties/contract_product_id",
      i18n: "form.contract_product",
      options: { placeholder: "Select a product…" }
    },
    {
      type: "Control",
      scope: "#/properties/pinned",
      i18n: "form.pinned"
    }
  );

  return { type: "VerticalLayout", elements } as UISchemaElement;
};

// -----------------------------------------------------------------------------

/**
 * The collection's QUERY schema — its whole request state (filters · sort ·
 * pagination) as ONE Draft-07 schema over one model. A SELF-CONTAINED JSON
 * literal, so it can be lifted straight into ajv or a test and run standalone.
 *
 * @decision
 * what: `filters.encrypted.eq` emits `filter[encrypted|eq]` (an
 *   operator-bearing branch), not the oracle's suffix-less `filter[encrypted]`.
 * why: the platform translator (`query/query.utils.ts:503-530`) emits
 *   `filter[column|op]` for any branch declaring `properties: { eq }` — only
 *   a branch with NO `properties` emits the suffix-less form. The model path
 *   `filters.encrypted.eq` is what the criteria control scopes and what the
 *   JTBD's third hole requires, and the two wire forms are the same query by
 *   the translator's own documentation. Gated by AC-31 / `parity.yaml` row
 *   X2 against a captured staging fixture (requirements.md §5.3).
 * rejected: a bare boolean `filters.encrypted` branch (no `properties`) —
 *   fully specified as the FALLBACK if the capture shows the suffixed form
 *   is rejected; not adopted up front because the suffixed form is already
 *   proven on this API (`client-email-history`'s recorded
 *   `filter[bounced|eq]=1` fixture).
 *
 * @decision D9 (repair cycle 2 — surfaces over, does not silently replace, design.md §6.1's original A4 note)
 * what: `filters.encrypted.eq` is typed `["boolean","null"]` (tri-state, same
 *   shape as `pinned.eq`), not the bare `"boolean"` design.md §6.1 originally
 *   specified ("no null member, because 'all' is not a state either legacy
 *   surface offers").
 * why: a bare `"boolean"` leaf is walked by the SHARED
 *   `useModelParser`'s boolean-coercion branch (`utils/useValidation.ts`,
 *   "NB ensure we always cast booleans correctly, we dont want null or
 *   undefined for booleans"), which forces an untouched `eq` to `false`
 *   rather than leaving it absent. Every request this module ever issues —
 *   including the very first boot read, before any `filterBy` call — carried
 *   a spurious `filter[encrypted|eq]=0`, silently narrowing "one entity, a
 *   flag decides which" to notes-only by default (AC-4's boot-request proof;
 *   confirmed independent of any `filterBy` timing). That is the JTBD
 *   sentence failing quietly, not a legacy-parity requirement: §6.1's "no
 *   null member" reasoning is about the legacy FILTER WIDGET never offering
 *   an "All" button, not about what the UNFILTERED base read should return.
 *   Widening to `["boolean","null"]` routes an untouched `eq` through
 *   `useModelParser`'s generic (non-boolean) branch instead, which resolves
 *   an absent value to `null` (stripped at the wire) rather than forcing
 *   `false` — a concrete `true`/`false` write is unaffected either way
 *   (AC-2/AC-31 unchanged). This does not require exposing a null/"all"
 *   option on the filter-bar CONTROL (`useQueryUischema`'s button-group can
 *   still render only the two legacy-shaped options); it only stops the
 *   schema from inventing a value nobody set.
 * rejected: fixing this in `useModelParser` itself — shared platform code
 *   outside this module's write lane, and it is deliberately strict for FORM
 *   models (a checkbox must never be null/undefined); the correct lever from
 *   inside this module is the schema's own declared type.
 *
 * @decision D2
 * what: the `sort` branch declares three additive columns
 *   (`label`/`pinned`/`created_at`) with NO `default` and NO `minItems`.
 * why: the oracle deletes `params.order` on every request and lets the BE
 *   apply pinned ordering (`vaultProvider.vue:162-165`). With no default the
 *   boot read carries no `order=` at all — parity-exact. A default would
 *   OVERRIDE the BE's own pinned ordering, a behaviour regression, which is
 *   why the absence of a default is a hard constraint, not a preference
 *   (`client-address.schemas.ts:356-361` resolves the same tension the same
 *   way). Declaring the branch at all (rather than omitting it) is required
 *   by the scenario lane's D15 gate, which halts on an ABSENT sort member.
 * rejected: (a) omitting the `sort` branch — parity-exact but halts the
 *   scenario lane; (b) defaulting to `pinned DESC` — invents an ordering the
 *   oracle never sends.
 *
 * `pagination.limit` defaults to **3** — the live client-area per-section
 * value (`clientNotesComp.vue:68`, `clientSecretsComp.vue:61`), NOT the
 * sibling `client-phone`/`client-address` default of `0`: the vault is
 * genuinely paged, unlike those whole-collection reads.
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
export function useQueryUischema(): UISchemaElement {
  return {
    type: "FilterBar",
    elements: [
      {
        type: "Control",
        scope: "#/properties/filters/properties/encrypted/properties/eq",
        i18n: "form.vault_asset_type",
        options: { format: "button-group", noLabel: true, optionalText: "" }
      },
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
        scope: "#/properties/filters/properties/pinned/properties/eq",
        i18n: "form.pinned_filter",
        options: { format: "button-group", noLabel: true, optionalText: "" }
      },
      {
        type: "Control",
        scope:
          "#/properties/filters/properties/contract_product_id/properties/eq",
        i18n: "form.contract_product_filter",
        options: { format: "select", noLabel: true, optionalText: "" }
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
