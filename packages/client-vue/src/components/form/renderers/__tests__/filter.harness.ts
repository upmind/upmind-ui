/**
 * @module form/renderers/__tests__/filter.harness
 * @description Mounts the REAL surface the canary mounts — client-vue's
 * `UpmForm`, which is where `formRenderers` (and therefore the `Filter`
 * renderer) is bound — against the client-email module's own
 * `useQuerySchema()` / `useQueryUischema()` and the real `packages/i18n`
 * `src/core` catalogue.
 *
 * Provenance: every input here is a shipped artefact read from the tree —
 * the module's declared query schema and uischema, and the i18n source of
 * truth (`src/core`, never `public/locales`, which is the Localazy download
 * target). Nothing is hand-authored.
 */

import { mount } from "@vue/test-utils";
import { defineComponent, h, ref } from "vue";
import { createI18n } from "vue-i18n";
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
  map,
  trim,
  uniq,
  unset
} from "lodash-es";
import type { JsonSchema7, Layout, UISchemaElement } from "@jsonforms/core";
import type { DOMWrapper, VueWrapper } from "@vue/test-utils";

export type QueryModel = Record<string, unknown>;

export const messages = { en: { action, error, form, text, validation } };

export type FilterMount = {
  wrapper: VueWrapper;
  model: () => QueryModel;
  column: (name: string) => DOMWrapper<Element>;
  settle: () => Promise<void>;
};

export async function mountFilters(options: {
  schema: JsonSchema7;
  uischema: UISchemaElement;
  model?: QueryModel;
  /**
   * `false` swaps `UpmForm` for the bare `upmind-ui` `Form` carrying the same
   * renderer set and NO `i18n` prop — the §13.4 blocker mount, kept reachable
   * so the translated assertions stay falsifiable.
   */
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
    column: name =>
      wrapper.find(
        `[data-test-key="form-item"][data-test-value="filters-${name}"]`
      ),
    settle
  };
}

/**
 * The shipped uischema with one option dropped from the element filtering a
 * named column — located by the scope it carries, never by its position, since
 * the layout IS the uischema and moves whenever the toolbar is re-expressed.
 */
export const uischemaWithout = (
  uischema: UISchemaElement,
  column: string,
  option: string
) => {
  const next = cloneDeep(uischema) as Layout;
  unset(
    find(next.elements, ({ scope }: UISchemaElement & { scope?: string }) =>
      endsWith(scope, `/${column}`)
    ),
    ["options", option]
  );
  return next as UISchemaElement;
};

export const messagesOf = (column: DOMWrapper<Element>) =>
  column
    .findAll('[data-test-key="form-item-message"]')
    .map(node => node.text());

/** The two tri-state treatments, each by the test key its own control carries. */
export const BUTTON_GROUP_POSITION = '[data-test-key="button"]';
export const TOGGLE_GROUP_POSITION = '[data-test-key="toggle-group-item"]';
const ANY_POSITION = `${BUTTON_GROUP_POSITION},${TOGGLE_GROUP_POSITION}`;

/** Every position the column offers, in order, as a user reads them. */
export const positionsOf = (column: DOMWrapper<Element>) =>
  map(column.findAll(ANY_POSITION), node => trim(node.text()));

/** The positions the column announces as chosen — never more than one. */
export const pressedIn = (column: DOMWrapper<Element>) =>
  map(
    filter(
      column.findAll(ANY_POSITION),
      node => node.attributes("aria-pressed") === "true"
    ),
    node => trim(node.text())
  );

export const positionAt = (column: DOMWrapper<Element>, value: string) =>
  column.find(`[data-test-value="${value}"]`);

/**
 * The field's own wrapper — the element `FormField` lays the label and the
 * control out in, and therefore the one carrying the layout variant.
 */
export const fieldLayoutOf = (column: DOMWrapper<Element>) =>
  column.find("div").classes();

/**
 * The column's rendered label, or `""` for a column that declares none —
 * §13.2 files `form.email_search` with `label: null`, so "no label" is a
 * legitimate answer this must be able to express rather than throw on.
 */
export const labelOf = (column: DOMWrapper<Element>) => {
  const label = column.find("label span span");
  return label.exists() ? label.text().trim() : "";
};

const USER_VISIBLE_ATTRIBUTES = ["placeholder", "aria-label", "title"];

/**
 * The element's OWN text, split per text node — `<label><span>x</span> form.foo</label>`
 * yields `["form.foo"]`. Collecting `.text()` off leaf elements instead would
 * miss that key entirely, and collecting it off every element would concatenate
 * descendants into one string no whole-value key match can see.
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
