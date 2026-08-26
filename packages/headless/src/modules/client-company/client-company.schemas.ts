/**
 * @public
 * @schema-fragment
 * @module client-company/client-company.schemas
 * @description Schema / uischema for the per-company form. They move as a
 * PAIR: a schema field with no control renders a required-but-invisible
 * input.
 *
 * `useCompanySchema` / `useCompanyUischema` are schema FRAGMENTS — pure
 * functions of their arguments, for composing the company form into a PARENT
 * schema (`basket-billing/unified`). A consumer rendering the company form
 * ITSELF must read `useClientCompanyManager().useContext().schema` /
 * `.uischema`, which are the schemas the machine actually validates against.
 * These two are not a second route to the module's data and must never
 * acquire one: no scope, no session, no request, no reactive state — the
 * `useCompanyEmailList` / `useCompanyEmailMutate` adapters below hand the
 * "email" control an UNFIRED composable reference, exactly as the existing
 * address block already hands the "address" control `useClientAddresses` /
 * `useClientAddressManager`; nothing is invoked, and nothing requests, until
 * the FORM renders that field (`design.md` D5).
 *
 * This is a DOCUMENTED DEVIATION from the reference conversion's
 * "NO SCHEMA EXPORTS HERE" law — see the `@decision` block in `design.md` D5.
 * Unlike every OTHER data-layer file in this module — each of which carries a
 * line-1 `@internal` marker — this one deliberately does not: it carries
 * `@public @schema-fragment` instead, because it is the one file this module
 * intentionally publishes on the barrel.
 */
import { computed } from "vue";
import {
  ClientAddressContextTypes,
  useClientAddresses,
  useClientAddressManager,
  useSchemaDefinitions as useAddressSchema,
  useUischemaDefinitions as useAddressUischema
} from "../client-address";
import { useClientEmailManager, useClientEmails } from "../client-email";
import { useClientPhoneManager, useClientPhones } from "../client-phone";
import { SortDirection } from "../query/query.types";
import { ScopeActorTypes } from "../scope/scope.types";
import { DEFAULT_SORT } from "./client-company.types";
import type { CompanyContext, QuerySchema } from "./client-company.types";
import type {
  ControlElement,
  JsonSchema7,
  Layout,
  UISchemaElement
} from "@jsonforms/core";

// -----------------------------------------------------------------------------
// Email adapters — `useClientEmails` / `useClientEmailManager` are SCOPED
// composables; the "Manager" uischema renderer (`ManageRenderer.vue`) expects
// the flat `MinimalListComposable` / `MinimalMutateComposable` shape, so these
// resolve `.as(SELF)` and flatten the four-layer return into that shape — the
// same fall-through `client-company.services.ts`'s `loadLookups` already uses
// for this cross-module call (`design.md` D2).
// -----------------------------------------------------------------------------

function useCompanyEmailList() {
  const emails = useClientEmails().as(ScopeActorTypes.SELF);
  const { data, default: defaultEmail } = emails.useContext();
  const { isLoading, hasError, isEmpty } = emails.useMeta();
  const { isReady } = emails.useActions();

  return {
    isReady,
    meta: computed(() => ({
      isLoading: isLoading.value,
      hasError: hasError.value,
      isEmpty: isEmpty.value
    })),
    data,
    default: defaultEmail
  };
}

function useCompanyEmailMutate(id?: string) {
  // FE-3111: `.withId(id)` replaces `.for('email', id)`. The scope matrix is
  // now all-null, so `.for()` is a compile-time error. `.withId()` places the
  // record id into `config.id`; actor defaults to SELF → CLIENT.
  const instance = id
    ? useClientEmailManager().withId(id)
    : useClientEmailManager().fresh();
  const { isReady, update, clear, input, destroy } = instance.useActions();
  const { model, schema, uischema, errors, validationErrors } =
    instance.useContext();
  const {
    isAvailable,
    isLoading,
    isValid,
    isDirty,
    isProcessing,
    hasErrors,
    isNew,
    isComplete
  } = instance.useMeta();

  return {
    isReady,
    meta: computed(() => ({
      isAvailable: isAvailable.value,
      isLoading: isLoading.value,
      isValid: isValid.value,
      isDirty: isDirty.value,
      isProcessing: isProcessing.value,
      hasErrors: hasErrors.value,
      isNew: isNew.value,
      isComplete: isComplete.value
    })),
    model,
    schema,
    uischema,
    errors,
    validationErrors,
    update,
    clear,
    input,
    stop: destroy
  };
}

// -----------------------------------------------------------------------------
// Address adapters — same shape as the email pair above, for the same reason:
// `useClientAddresses` / `useClientAddressManager` became SCOPED composables
// and the "Manager" uischema renderer calls them BARE. Handing the renderer an
// unadapted scope builder compiles cleanly (the options object is cast
// `as any`) and fails at runtime (`design.md` D-13, hazard Z7).
//
// Two obligations the address adapters carry that the email pair does not:
// `default` RE-HYDRATES to the row, because the module's own `default()` is
// now the ID (R5) while `Select.vue:97` reads `defaultItem()?.id`; and `stop`
// maps to `destroy`, or every opened address leaves a registry entry holding a
// live TanStack observer.
//
// They raise NO feedback: under operator ruling R10 `client-address` still
// raises its own on `remove` / `setDefault`, and a consumer-side raise on top
// would double every message. That is the one place these deliberately differ
// from the company adapters in `TabBusiness.vue`.
// -----------------------------------------------------------------------------

function useCompanyAddressList() {
  const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
  const { data, default: defaultAddressId, getOne } = addresses.useContext();
  const { isLoading, hasError, isEmpty } = addresses.useMeta();
  const { isReady, remove, setDefault } = addresses.useActions();

  return {
    isReady,
    meta: computed(() => ({
      isLoading: isLoading.value,
      hasError: hasError.value,
      isEmpty: isEmpty.value
    })),
    data,
    default: () => getOne(defaultAddressId()),
    remove,
    setDefault
  };
}

function useCompanyAddressMutate(id?: string) {
  const manager = useClientAddressManager().as(ScopeActorTypes.CLIENT);
  const instance = id
    ? manager.for(ClientAddressContextTypes.ADDRESS, id)
    : manager.fresh();
  const { isReady, update, clear, input, destroy } = instance.useActions();
  const { model, schema, uischema, errors, validationErrors } =
    instance.useContext();
  const {
    isAvailable,
    isLoading,
    isValid,
    isDirty,
    isProcessing,
    hasErrors,
    isNew,
    isComplete
  } = instance.useMeta();

  return {
    isReady,
    meta: computed(() => ({
      isAvailable: isAvailable.value,
      isLoading: isLoading.value,
      isValid: isValid.value,
      isDirty: isDirty.value,
      isProcessing: isProcessing.value,
      hasErrors: hasErrors.value,
      isNew: isNew.value,
      isComplete: isComplete.value
    })),
    model,
    schema,
    uischema,
    errors,
    validationErrors,
    update,
    clear,
    input,
    stop: destroy
  };
}

// -----------------------------------------------------------------------------

export const useSchema = ({
  countries,
  country: _country,
  regions,
  baseModel,
  config
}: Partial<CompanyContext>): JsonSchema7 => {
  const schema: JsonSchema7 = {
    type: "object",
    title: "Company",
    required: ["name"],
    definitions: useAddressSchema({
      config,
      countries,
      regions,
      baseModel
    }),
    properties: {
      id: {
        type: ["string", "null"],
        title: "ID",
        description: "The AutoGenerated ID of this Company.",
        readOnly: true
      },
      name: {
        type: "string",
        title: "Company Name"
      },
      regNumber: {
        type: ["string", "null"],
        title: "Company Number"
      },
      tax: {
        type: "object",
        title: "Tax Details",
        properties: {
          number: {
            type: ["string", "null"],
            title: "Registered Tax ID"
          }
        }
      },
      addressId: {
        type: ["string", "null"],
        title: "Address",
        default: baseModel?.addressId
      },
      address: { $ref: "#/definitions/address" },
      emailId: {
        type: ["string", "null"],
        title: "Email",
        default: baseModel?.emailId
      },
      phoneId: {
        type: ["string", "null"],
        title: "Phone",
        default: baseModel?.phoneId
      }
    }
  };

  // If we already have an address, we always use the addressId; otherwise we
  // allow a full address object, as we need to create one.
  if (baseModel?.addressId) {
    schema.required!.push("addressId");
    delete schema?.properties?.address;
  } else {
    schema.required!.push("address");
  }

  return schema;
};

export const useUischema = ({
  baseModel,
  minimal,
  countries,
  regions
}: Partial<CompanyContext>) => {
  // Explicitly typed so `.push()` below accepts any `UISchemaElement` — an
  // inferred (untyped) declaration narrows `elements` to the shape of these
  // first two literal entries, which is what forced the pre-conversion `as any`
  // casts at every later push.
  const uiSchema: { type: string; elements: UISchemaElement[] } = {
    type: "VerticalLayout",
    elements: [
      {
        type: "Control",
        scope: "#/properties/name",
        i18n: "form.companyName",
        options: {
          autoFocus: true,
          autocomplete: "off",
          placeholder: "My company name"
        }
      },
      {
        type: "HorizontalLayout",
        elements: [
          {
            type: "Control",
            scope: "#/properties/regNumber",
            i18n: "form.companyNumber",
            options: {
              placeholder: "Registered tax or GST"
            }
          },
          {
            type: "Control",
            scope: "#/properties/tax/properties/number",
            i18n: "form.taxNumber",
            options: {
              placeholder: "Tax Id"
            }
          }
        ]
      }
    ]
  };

  // Either an existing addressId or a new-address uiSchema.
  if (!baseModel?.addressId) {
    uiSchema.elements.push({
      type: "VerticalLayout",
      elements: [useAddressUischema({ countries, regions })]
    } as any);
  } else {
    uiSchema.elements.push({
      type: "Manager",
      scope: "#/properties/addressId",
      i18nKey: "form.address",
      options: {
        manage: {
          useList: useCompanyAddressList,
          useMutate: useCompanyAddressMutate
        }
      }
    } as any);
  }

  // In-cell gap G6 — the email and phone controls, alongside the address one.
  // A client is otherwise silently locked to their default email and phone
  // (`parity.yaml` C25); `loadLookups` already fetches both collections and
  // seeds `baseModel.emailId` / `.phoneId` — only the form control was missing.
  if (!minimal) {
    uiSchema.elements.push({
      type: "Manager",
      scope: "#/properties/emailId",
      i18nKey: "form.email",
      options: {
        manage: {
          useList: useCompanyEmailList,
          useMutate: useCompanyEmailMutate
        }
      }
    } as UISchemaElement);

    uiSchema.elements.push({
      type: "Manager",
      scope: "#/properties/phoneId",
      i18nKey: "form.phone",
      options: {
        manage: {
          useList: useClientPhones,
          useMutate: useClientPhoneManager
        }
      }
    } as UISchemaElement);
  }

  return uiSchema as UISchemaElement;
};

// -----------------------------------------------------------------------------

/**
 * The collection's QUERY schema — its whole request state (filters · sort ·
 * pagination) as ONE Draft-07 schema over one model. A SELF-CONTAINED JSON
 * literal, so it can be lifted straight into ajv or a test and run standalone.
 *
 * Companies are read whole for the billing surfaces that pick one, so
 * `pagination.limit` keeps `default: 0` (the unpaged read) — both legacy
 * consumers ask for it (`billableEntitiesProvider.vue:191-203`,
 * `clientCompanySelect.vue:110-114`) — while `setCriteria({ pagination })`
 * still reaches the window. `sort.default` is `created_at` ASC, the exact wire
 * the pre-conversion raw literal produced. The one declared filter is the
 * free-text search, bound to the `name` column.
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
          name: {
            type: "object",
            title: "text.company",
            additionalProperties: false,
            properties: {
              // The bare term — the translator adds the % wildcards.
              like: { type: ["string", "null"], minLength: 1 }
            }
          },
          verified: {
            type: "object",
            title: "Verified",
            additionalProperties: false,
            properties: {
              // `null` is a MEMBER, not an absence: it is the value the unset
              // position writes, so a tri-state's clear has to validate, and it
              // is the enum entry whose label the control resolves.
              eq: {
                type: ["boolean", "null"],
                enum: [true, false, null]
              }
            }
          },
          default: {
            type: "object",
            title: "Default",
            additionalProperties: false,
            properties: {
              eq: {
                type: ["boolean", "null"],
                enum: [true, false, null]
              }
            }
          }
        }
      },
      sort: {
        type: "array",
        default: DEFAULT_SORT,
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: { enum: ["name", "created_at"] },
            dir: { enum: [SortDirection.ASC, SortDirection.DESC] }
          }
        }
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 0, default: 0 },
          offset: { type: "integer", minimum: 0, default: 0 }
        }
      }
    }
  } satisfies JsonSchema7;
}

/**
 * The module's DEFAULT filter-bar presentation over the one query schema — a
 * single `Control` over the `name` search leaf. `FilterBar` is the same
 * literal element type `client-email.schemas.ts` uses (client-vue's
 * `FilterBarRenderer`, spelt as a literal because headless cannot import from
 * client-vue).
 */
export function useQueryUischema(): Layout {
  return {
    type: "FilterBar",
    elements: [
      {
        type: "Control",
        scope: "#/properties/filters/properties/name/properties/like",
        i18n: "form.company_search",
        options: {
          format: "search",
          icon: "search-md",
          noLabel: true,
          optionalText: ""
        }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/verified/properties/eq",
        i18n: "form.verified_filter",
        options: { format: "button-group", noLabel: true, optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/default/properties/eq",
        i18n: "form.default_filter",
        options: { format: "button-group", noLabel: true, optionalText: "" }
      }
    ]
  };
}

/**
 * The collection's ORDERING presentation — one element over the query
 * schema's `sort` branch. Its `i18n` is also the option-key PREFIX: a field
 * resolves as `<i18n>.<field>` (`form.company_sort.created_at`).
 */
export function useSortUischema(): ControlElement {
  return {
    type: "Control",
    scope: "#/properties/sort",
    i18n: "form.company_sort"
  };
}
