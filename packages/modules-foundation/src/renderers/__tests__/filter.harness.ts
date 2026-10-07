/**
 * @module foundation/renderers/__tests__/filter.harness
 * @description Mounts the REAL surface the filter renderers are bound through —
 * foundation's `UpmForm`, with `foundationRenderers` registered as an app registers them —
 * against the two consumer query declarations and the real `packages/i18n`
 * `src/core` catalogue.
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

import { Form, provideFormIcon } from "@upmind/ui";
import { DOMWrapper, mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { createI18n } from "vue-i18n";
import {
  PAGINATION,
  SortDirection,
  useContractProducts,
  useI18n as useLocalisation,
  useInvoices
} from "@upmind-automation/headless";
import {
  Icon,
  foundationRenderers,
  registerFormRenderers,
  useFormI18n
} from "../../index";
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
import type {
  JsonFormsRendererRegistryEntry,
  JsonSchema7,
  Layout,
  UISchemaElement
} from "@jsonforms/core";
import type { VueWrapper } from "@vue/test-utils";

export type QueryModel = Record<string, unknown>;

export type QueryDeclaration = {
  schema: JsonSchema7;
  uischema: UISchemaElement;
};

// `@upmind/ui` also exports a `Form` (the bare engine), so the wrapper is read by name.
const { Form: UpmForm } = await import("../../index");

/**
 * The SHIPPED catalogue, loaded the way the app loads it: headless's own
 * `useI18n` over the `packages/i18n` source glob. No file is hand-picked here.
 */
const catalogueInstance = createI18n({ legacy: false, locale: "en" });
const localisation = useLocalisation();
localisation.init(
  catalogueInstance,
  import.meta.glob("../../../../i18n/src/**/*-en.json", { eager: true })
);
await localisation.loadLocaleMessages("en");

export const messages = {
  en: catalogueInstance.global.getLocaleMessage("en") as Record<string, unknown>
};

const emptyLayout: Layout = { type: "VerticalLayout", elements: [] };

registerFormRenderers(foundationRenderers);

const probe = mount(
  defineComponent({
    setup: () => () =>
      h(UpmForm, {
        schema: { type: "object", properties: {} },
        uischema: emptyLayout,
        modelValue: {},
        noActions: true
      })
  }),
  {
    global: { plugins: [createI18n({ legacy: false, locale: "en", messages })] }
  }
);

/**
 * The renderer set `UpmForm` hands the engine, read off a mounted form, so a
 * claim scored against it is a claim about the shipped set.
 */
export const formRenderers: JsonFormsRendererRegistryEntry[] = probe
  .findComponent(Form)
  .props("additionalRenderers");
probe.unmount();

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
 * The `invoices` collection's REAL, live-published query declaration — never
 * transcribed. Unlike `clientEmailQuery`/`clientEmailHistoryQuery` above, this
 * is pulled straight off `useInvoices().as("self").useContext().schemas.query`
 * at call time: the module's own public composable surface, not a hand-copied
 * shape. This is deliberate — a transcription can drift from its source
 * invisibly (see the PROVENANCE note above); the invoices bar shipped broken
 * three times behind gates that graded a model or a transcription, never the
 * module's own live wire shape, so this declaration is sourced the one way
 * that cannot go stale relative to what the module actually publishes.
 */
export const invoicesQuery = (): QueryDeclaration => {
  const { schemas } = useInvoices().as("self").useContext();
  return {
    schema: schemas.query.schema as JsonSchema7,
    uischema: schemas.query.uischema as UISchemaElement
  };
};

/**
 * The `contract-products` collection's live-published query declaration, pulled
 * off `useContractProducts().as("self").useContext().schemas.query` for the same
 * reason as `invoicesQuery`: a transcription cannot go stale unnoticed here.
 */
export const contractProductsQuery = (): QueryDeclaration => {
  const { schemas } = useContractProducts().as("self").useContext();
  return {
    schema: schemas.query.schema as JsonSchema7,
    uischema: schemas.query.uischema as UISchemaElement
  };
};

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
  /**
   * Opens a `multi-select` facet's menu and returns its options. The menu
   * panel is TELEPORTED to `document.body`, so it is neither in the wrapper's
   * tree nor in the DOM at all until the trigger is pressed — a facet's
   * options can only be read through here.
   */
  openFacet: (path: string) => Promise<DOMWrapper<Element>[]>;
};

/**
 * Mounts a declaration through the control registry `UpmForm` reads.
 *
 * @param options.translate - `false` swaps `UpmForm` for `@upmind/ui`'s bare
 *   engine `Form` carrying the same renderer set and NO `i18n` prop, so the
 *   translated assertions stay falsifiable. The icon provider `UpmForm` installs
 *   is installed here too — the engine draws no glyph without one, and losing
 *   the glyphs is not what this branch exists to vary.
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
      provideFormIcon(Icon);
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

  const wrapper = mount(harness, {
    attachTo: document.body,
    global: { plugins: [i18n] }
  });
  const settle = () => new Promise<void>(resolve => setTimeout(resolve, 60));
  await settle();

  const column = (path: string) =>
    wrapper.find(
      `[data-test-key="form-item"][data-test-value="${kebabCase(path)}"]`
    );

  return {
    wrapper,
    model: () => model.value,
    column,
    settle,
    openFacet: async path => {
      const trigger = column(path).find(
        '[data-test-key="filter-multi-select"]'
      );
      if (!trigger.exists())
        throw new Error(`No multi-select facet trigger at "${path}"`);

      if (trigger.attributes("aria-expanded") !== "true") {
        await trigger.trigger("click");
        await settle();
      }

      // The panel is teleported to `document.body`, so it is outside the
      // wrapper's tree; `aria-controls` is what ties it back to THIS trigger,
      // which matters once a second facet's menu is open beside it.
      //
      // The LAST match, not `getElementById`'s first: JSON Forms derives a
      // control's id from its scope, so every mount in a file produces the
      // same ids, and a previous test's panel is still attached to this body.
      // The first match is that dead panel, whose items dispatch into a form
      // nobody is watching any more.
      const panelId = trigger.attributes("aria-controls");
      const panels = panelId
        ? document.body.querySelectorAll(`[id="${panelId}"]`)
        : [];
      const panel = panels[panels.length - 1];
      if (!panel) throw new Error(`Facet menu at "${path}" did not open`);

      return map(
        panel.querySelectorAll('[data-test-key="option-tile"]'),
        node => new DOMWrapper(node)
      );
    }
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

/**
 * Both tri-state controls (button-group and toggle-group formats) now render
 * the same primitive: segmented toggle items with enum-keyed test values.
 */
export const BUTTON_GROUP_POSITION = '[data-test-key="toggle-group-item"]';
export const TOGGLE_GROUP_POSITION = '[data-test-key="toggle-group-item"]';
const ANY_POSITION = TOGGLE_GROUP_POSITION;

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
