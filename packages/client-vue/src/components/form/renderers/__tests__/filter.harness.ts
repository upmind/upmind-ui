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
import { Form } from "@upmind-automation/upmind-ui";
import action from "../../../../../../i18n/src/core/action-en.json";
import error from "../../../../../../i18n/src/core/error-en.json";
import form from "../../../../../../i18n/src/core/form-en.json";
import text from "../../../../../../i18n/src/core/text-en.json";
import validation from "../../../../../../i18n/src/core/validation-en.json";
import { UpmForm } from "../../index";
import { useFormI18n } from "../../useFormI18n";
import { formRenderers } from "../index";
import { compact, filter, flatMap, map } from "lodash-es";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
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

export const messagesOf = (column: DOMWrapper<Element>) =>
  column
    .findAll('[data-test-key="form-item-message"]')
    .map(node => node.text());

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
 * Every string the mount puts in front of a user — the text of each leaf node
 * plus the user-visible attributes — as atomic strings, so a whole-value key
 * match means a raw key reached the surface.
 */
export const renderedStrings = (root: VueWrapper | DOMWrapper<Element>) => {
  const nodes: DOMWrapper<Element>[] = root.findAll("*");

  return compact([
    ...map(
      filter(nodes, node => node.element.children.length === 0),
      node => node.text().trim()
    ),
    ...flatMap(nodes, node =>
      map(USER_VISIBLE_ATTRIBUTES, attribute => node.attributes(attribute))
    )
  ]);
};
