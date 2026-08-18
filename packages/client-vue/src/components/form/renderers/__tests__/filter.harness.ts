/**
 * @module form/renderers/__tests__/filter.harness
 * @description Mounts the REAL surface the filter renderers are bound through —
 * client-vue's `UpmForm`, which is where `formRenderers` is registered — against
 * the two consumer query declarations and the real `packages/i18n` `src/core`
 * catalogue.
 *
 * PROVENANCE. `clientEmailQuery()` / `clientEmailHistoryQuery()` are transcribed
 * verbatim from the shipped declarations at
 * `packages/headless/src/modules/client-email/client-email.schemas.ts` and
 * `packages/headless/src/modules/client-email-history/client-email-history.schemas.ts`,
 * which are `@internal` and reach no other package. They are DECLARATIONS, not
 * recorded wire data — nothing here stands in for a captured response. The i18n
 * catalogue is imported from the shipped source of truth (`src/core`, never
 * `public/locales`, the Localazy download target), never copied.
 *
 * Drift between a transcription and its source is invisible from this package.
 * It is pinned in the owning modules' own specs
 * (`<module>/__tests__/query-uischema.test.ts`), which import the shipped
 * declaration directly.
 */

import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { createI18n } from "vue-i18n";
import { PAGINATION, SortDirection } from "@upmind-automation/headless";
import action from "@upmind-automation/i18n/core/action-en.json";
import error from "@upmind-automation/i18n/core/error-en.json";
import form from "@upmind-automation/i18n/core/form-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import validation from "@upmind-automation/i18n/core/validation-en.json";
import { Form } from "@upmind-automation/upmind-ui";
import { UpmForm } from "../../index";
import { useFormI18n } from "../../useFormI18n";
import { formRenderers } from "../index";
import {
  cloneDeep,
  compact,
  endsWith,
  filter,
  find,
  flatMap,
  get,
  kebabCase,
  map,
  set,
  trim,
  uniq,
  unset
} from "lodash-es";
import type { JsonSchema7, Layout, UISchemaElement } from "@jsonforms/core";
import type { DOMWrapper, VueWrapper } from "@vue/test-utils";

export type QueryModel = Record<string, unknown>;

export type QueryDeclaration = {
  schema: JsonSchema7;
  uischema: UISchemaElement;
};

export const messages = { en: { action, error, form, text, validation } };

// -----------------------------------------------------------------------------
// The transcribed consumer declarations — see PROVENANCE above.
// -----------------------------------------------------------------------------

/** The `client-email` collection's query schema and its filter-bar uischema. */
export const clientEmailQuery = (): QueryDeclaration => ({
  schema: {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          email: {
            type: "object",
            title: "Email address",
            additionalProperties: false,
            properties: {
              like: { type: ["string", "null"], minLength: 1 }
            }
          },
          verified: {
            type: "object",
            title: "Verified",
            additionalProperties: false,
            properties: {
              eq: { type: ["boolean", "null"], enum: [true, false, null] }
            }
          },
          bounced: {
            type: "object",
            title: "Bounced",
            additionalProperties: false,
            properties: {
              eq: { type: ["boolean", "null"], enum: [true, false, null] }
            }
          }
        }
      },
      sort: {
        type: "array",
        default: [
          { field: "default", dir: SortDirection.DESC },
          { field: "email", dir: SortDirection.ASC }
        ],
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: {
              enum: ["default", "email", "verified", "bounced", "created_at"]
            },
            dir: { enum: [SortDirection.ASC, SortDirection.DESC] }
          }
        }
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 0, default: PAGINATION.limit },
          offset: { type: "integer", minimum: 0 }
        }
      }
    }
  } as JsonSchema7,
  uischema: {
    type: "FilterBar",
    elements: [
      {
        type: "Control",
        scope: "#/properties/filters/properties/email/properties/like",
        i18n: "form.email_search",
        options: { format: "search", noLabel: true, optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/verified/properties/eq",
        i18n: "form.verified_filter",
        options: { format: "button-group", noLabel: true, optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/bounced/properties/eq",
        i18n: "form.bounced_filter",
        options: { format: "toggle-group", noLabel: true, optionalText: "" }
      }
    ]
  } as UISchemaElement
});

/** The `client-email-history` collection's query schema and filter-bar uischema. */
export const clientEmailHistoryQuery = (): QueryDeclaration => ({
  schema: {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          subject: {
            type: "object",
            title: "Subject",
            additionalProperties: false,
            properties: {
              like: { type: ["string", "null"], minLength: 1 }
            }
          },
          sent: {
            type: "object",
            title: "Sent",
            additionalProperties: false,
            properties: {
              eq: { type: ["boolean", "null"], enum: [true, false, null] }
            }
          },
          bounced: {
            type: "object",
            title: "Bounced",
            additionalProperties: false,
            properties: {
              eq: { type: ["boolean", "null"], enum: [true, false, null] }
            }
          },
          error_id: {
            type: "object",
            title: "Failed",
            additionalProperties: false,
            properties: {
              neq: { type: ["string", "null"], minLength: 1 }
            }
          }
        }
      },
      sort: {
        type: "array",
        default: [{ field: "created_at", dir: SortDirection.DESC }],
        minItems: 1,
        uniqueItems: true,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["field", "dir"],
          properties: {
            field: { enum: ["created_at", "subject"] },
            dir: { enum: ["asc", "desc"] }
          }
        }
      },
      pagination: {
        type: "object",
        additionalProperties: false,
        properties: {
          limit: { type: "integer", minimum: 0, default: PAGINATION.limit },
          offset: { type: "integer", minimum: 0 }
        }
      }
    }
  } as JsonSchema7,
  uischema: {
    type: "FilterBar",
    elements: [
      {
        type: "Control",
        scope: "#/properties/filters/properties/subject/properties/like",
        i18n: "form.subject_search",
        options: { format: "search", noLabel: true, optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/sent/properties/eq",
        i18n: "form.sent_filter",
        options: { format: "button-group", noLabel: true, optionalText: "" }
      },
      {
        type: "Control",
        scope: "#/properties/filters/properties/bounced/properties/eq",
        i18n: "form.bounced_filter",
        options: { format: "toggle-group", noLabel: true, optionalText: "" }
      }
    ]
  } as UISchemaElement
});

/**
 * A two-ended date column and the element that scopes it — the `range` format's
 * declaration. No consumer bar draws one yet, so unlike the two above this is a
 * declaration the format's own contract defines rather than a transcription.
 */
export const rangeQuery = (): QueryDeclaration => ({
  schema: {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    additionalProperties: false,
    properties: {
      filters: {
        type: "object",
        additionalProperties: false,
        properties: {
          created_at: {
            type: "object",
            title: "Created",
            additionalProperties: false,
            properties: {
              gte: { type: ["string", "null"] },
              lte: { type: ["string", "null"] }
            }
          }
        }
      }
    }
  } as JsonSchema7,
  uischema: {
    type: "FilterBar",
    elements: [
      {
        type: "Control",
        scope: "#/properties/filters/properties/created_at",
        i18n: "form.created_at_filter",
        options: { format: "range", noLabel: true, optionalText: "" }
      }
    ]
  } as UISchemaElement
});

// -----------------------------------------------------------------------------

export type FilterMount = {
  wrapper: VueWrapper;
  model: () => QueryModel;
  column: (path: string) => DOMWrapper<Element>;
  settle: () => Promise<void>;
};

/**
 * Mounts a declaration through the renderer registry `UpmForm` binds.
 *
 * @param options.translate - `false` swaps `UpmForm` for the bare `upmind-ui`
 *   `Form` carrying the same renderer set and NO `i18n` prop, so the translated
 *   assertions stay falsifiable.
 */
export async function mountFilters(options: {
  schema: JsonSchema7;
  uischema: UISchemaElement;
  model?: QueryModel;
  translate?: boolean;
}): Promise<FilterMount> {
  const model = ref<QueryModel>(options.model ?? {});
  const i18n = createI18n({ legacy: false, locale: "en", messages });

  const harness = defineComponent({
    setup() {
      const translator = useFormI18n();
      const shared = {
        noActions: true,
        touched: true,
        schema: options.schema,
        uischema: options.uischema,
        modelValue: model.value,
        "onUpdate:modelValue": (next: QueryModel) => (model.value = next)
      };
      return () =>
        options.translate === false
          ? h(Form, { ...shared, additionalRenderers: formRenderers })
          : h(UpmForm, { ...shared, i18n: translator.value });
    }
  });

  const wrapper = mount(harness, { global: { plugins: [i18n] } });
  const settle = () => new Promise<void>(resolve => setTimeout(resolve, 60));
  await settle();

  return {
    wrapper,
    model: () => model.value,
    column: path =>
      wrapper.find(
        `[data-test-key="form-item"][data-test-value="${kebabCase(path)}"]`
      ),
    settle
  };
}

/**
 * A uischema with one element's `options` replaced, the element located by the
 * scope it carries rather than by its position.
 *
 * @param options - `undefined` DELETES the options bag, which is how an element
 *   declaring no `format` is expressed.
 */
export const uischemaWithOptions = (
  uischema: UISchemaElement,
  scopeSuffix: string,
  options?: Record<string, unknown>
) => {
  const next = cloneDeep(uischema) as Layout;
  const element = find(
    next.elements,
    ({ scope }: UISchemaElement & { scope?: string }) =>
      endsWith(scope, scopeSuffix)
  );

  if (options) set(element as object, "options", options);
  else unset(element, "options");

  return next as UISchemaElement;
};

/** The element a uischema declares for a scope, by exact scope. */
export const elementFor = (
  uischema: UISchemaElement,
  scope: string
): UISchemaElement =>
  find(
    (uischema as Layout).elements,
    element => get(element, "scope") === scope
  ) as UISchemaElement;

/**
 * A JSON Forms i18n key resolved against the SHIPPED catalogue, the way
 * `useFormI18n`'s translator resolves it — `undefined` for a key `packages/i18n`
 * does not carry, so an expectation written as `catalogue("form.x.true")` cannot
 * be satisfied by a key that was never translated.
 */
export const catalogue = (key: string): string | undefined =>
  get(messages.en, key);

export const messagesOf = (column: DOMWrapper<Element>) =>
  map(column.findAll('[data-test-key="form-item-message"]'), node =>
    node.text()
  );

/** The two tri-state controls, each by the test key its own primitive carries. */
export const BUTTON_GROUP_POSITION = '[data-test-key="button"]';
export const TOGGLE_GROUP_POSITION = '[data-test-key="toggle-group-item"]';
const ANY_POSITION = `${BUTTON_GROUP_POSITION},${TOGGLE_GROUP_POSITION}`;

/** Every position the column offers, in order, as a user reads them. */
export const positionsOf = (column: DOMWrapper<Element>) =>
  map(column.findAll(ANY_POSITION), node => trim(node.text()));

const pressedPositions = (column: DOMWrapper<Element>) =>
  filter(
    column.findAll(ANY_POSITION),
    node => node.attributes("aria-pressed") === "true"
  );

/** The positions the column announces as chosen, by name — never more than one. */
export const pressedIn = (column: DOMWrapper<Element>) =>
  map(pressedPositions(column), node => trim(node.text()));

/**
 * The same positions by the VALUE each stands for, so an assertion about which
 * position is pressed survives a catalogue that has not translated its name.
 */
export const pressedValuesIn = (column: DOMWrapper<Element>) =>
  map(pressedPositions(column), node => node.attributes("data-test-value"));

/** Every value the column offers a position for, in the order drawn. */
export const positionValuesOf = (column: DOMWrapper<Element>) =>
  map(column.findAll(ANY_POSITION), node => node.attributes("data-test-value"));

/**
 * The position carrying a value, matched in JS rather than by selector: jsdom's
 * `[data-test-value="null"]` also matches every element carrying NO such
 * attribute, so a selector would silently hand back the wrong node for the very
 * position — unset — these files exist to interrogate.
 */
export const positionAt = (column: DOMWrapper<Element>, value: string) =>
  find(
    column.findAll(ANY_POSITION),
    node => node.attributes("data-test-value") === value
  ) ?? column.find('[data-test-key="position-not-drawn"]');

/**
 * The position a column draws under a NAME. The `Button` primitive the button
 * group is built from derives its `data-test-value` from its own label rather
 * than the value it stands for (the FE-2874 audit's label-derived fallback), so
 * that group's positions are unreachable by value and are addressed by the name
 * the catalogue gave them instead.
 */
export const positionNamed = (column: DOMWrapper<Element>, name?: string) =>
  find(column.findAll(ANY_POSITION), node => trim(node.text()) === name) ??
  column.find('[data-test-key="position-not-drawn"]');

/**
 * The column's rendered label, or `""` for a column that draws none — a
 * label-less control is a legitimate answer this must express rather than throw
 * on.
 */
export const labelOf = (column: DOMWrapper<Element>) => {
  const label = column.find("label");
  return label.exists() ? trim(label.text()) : "";
};

const USER_VISIBLE_ATTRIBUTES = ["placeholder", "aria-label", "title"];

/**
 * The element's OWN text, split per text node — `<label><span>x</span> form.foo</label>`
 * yields `["form.foo"]`. Collecting `.text()` off leaf elements instead would
 * miss that key entirely, and off every element would concatenate descendants
 * into one string no whole-value key match can see.
 */
const ownText = (element: Element) =>
  map(
    filter(element.childNodes, node => node.nodeType === Node.TEXT_NODE),
    node => trim(node.textContent ?? "")
  );

/**
 * Every string the mount puts in front of a user — each rendered text node plus
 * the user-visible attributes — as atomic strings, so a whole-value key match
 * means a raw key reached the surface.
 */
export const renderedStrings = (root: VueWrapper | DOMWrapper<Element>) => {
  // `findAll` reaches the root itself off a `VueWrapper` but not off a
  // `DOMWrapper`, so the root is added and the list deduped rather than assumed.
  const elements: Element[] = uniq([
    root.element as Element,
    ...map(root.findAll("*"), node => node.element)
  ]);

  return compact([
    ...flatMap(elements, ownText),
    ...flatMap(elements, element =>
      map(USER_VISIBLE_ATTRIBUTES, attribute => element.getAttribute(attribute))
    )
  ]);
};

const I18N_KEY_SHAPE = /^[a-z][a-zA-Z0-9_]*\.[a-zA-Z][a-zA-Z0-9_.]*$/;

/** The rendered strings that are untranslated i18n keys rather than prose. */
export const rawKeysIn = (strings: string[]) =>
  filter(strings, string => I18N_KEY_SHAPE.test(string));
