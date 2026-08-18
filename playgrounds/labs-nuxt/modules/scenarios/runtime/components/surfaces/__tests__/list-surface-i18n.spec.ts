// -----------------------------------------------------------------------------
/**
 * @fileoverview The i18n sweep, measured on the RENDERED surface (Task 49/55,
 * W-D19/FB4 — "every user-visible string via i18n").
 *
 * ## Job To Be Done
 * A source grep for `"No data"` proves nothing: a string can be hardcoded in a
 * primitive the surface mounts, and a key can be *supplied* correctly and still
 * reach the user raw because no translator was installed. So the measurement is
 * the DOM the operator actually reads, over every state the client-emails page's list can be
 * in, against the shipped `packages/i18n/src` catalogue.
 *
 * Two failures are caught, not one:
 * - a raw KEY on screen (`text.foo`) — supplied but never translated;
 * - a rendered string that is in no catalogue at all — hardcoded English.
 *
 * The old key-derived allowance (`Id:`, `Address:` — labels the surface computed
 * off whatever keys a row happened to carry) is GONE on purpose: since G3 the
 * scenario declares its columns and their i18n keys, so a label computed from a
 * row key is a hardcoded string like any other, and `id` is the exact value
 * C15 says must never reach a column.
 *
 * The control-bearing states carry the module's OWN declared channel and
 * criteria, so the ordering control, the column picker and the refinements row
 * are inside the measurement rather than gated out of it — and the locked
 * variant is the only one that draws the `title` tooltips.
 *
 * ## What Breaks If These Fail
 * The one surface the operator opens ships English that Localazy never sees,
 * and the client-emails page reads as broken in every locale but `en`.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { createI18n } from "vue-i18n";
import textCatalogue from "@upmind-automation/i18n/core/text-en.json";
import {
  declaringChannel,
  declaringCriteria
} from "../../../../testing/declared-table";
import { defaultRow, unverifiedRow } from "../../../../testing/recorded-emails";
import {
  CATALOGUES,
  KEY_SHAPE,
  TRANSLATED,
  rawKeys,
  renderedStrings,
  untranslated
} from "../../../../testing/rendered";
import clientEmails from "../../../../useClientEmails/client-email.scenario";
import { RESOLVED_HANDOFFS } from "../../__tests__/resolved-handoffs";
import { ListSurface } from "../index";
import {
  filter,
  flatMap,
  forEach,
  intersection,
  isObject,
  keys,
  map,
  mapValues,
  uniq
} from "lodash-es";
import type { ModulePortCriteria } from "../../../composables/useModulePort.types";
import type { DeclaringTableChannel } from "../../../composables/useTableChannel.types";
import type { I18n } from "vue-i18n";

// -----------------------------------------------------------------------------

/** The capture run's own records — the rows the declared columns draw from. */
const rows = [defaultRow, unverifiedRow];

/** Values that came out of the RECORDING; copy is what is left over. */
const dataDerived = uniq(flatMap(rows, row => [row.id, row.email]));

const declared = await declaringChannel("client-email", {
  sort: [{ field: "email", dir: "asc" }],
  total: rows.length
});
const criteria = await declaringCriteria("client-email");

function mountList(
  overrides: {
    data?: unknown[];
    meta?: Record<string, unknown>;
    contextError?: unknown;
    withActions?: boolean;
    table?: DeclaringTableChannel;
    criteria?: ModulePortCriteria;
    locked?: boolean;
  },
  plugins: unknown[] = []
) {
  const actions = overrides.withActions
    ? {
        remove: vi.fn(),
        setDefault: vi.fn(),
        verify: vi.fn(),
        ensure: vi.fn()
      }
    : {};

  return mount(ListSurface, {
    attachTo: document.body,
    props: {
      snapshot: {
        actions: keys(actions),
        context: {
          data: overrides.data ?? rows,
          error: overrides.contextError
        },
        meta: overrides.meta ?? { isEmpty: false, isFiltered: false }
      },
      actions,
      presentation: clientEmails.presentation,
      table: overrides.table,
      criteria: overrides.criteria,
      handoffs: overrides.table ? RESOLVED_HANDOFFS : undefined,
      locked: overrides.locked
    },
    global: { plugins }
  });
}

const STATES: [string, Parameters<typeof mountList>[0]][] = [
  ["rows, no actions", {}],
  ["rows with the full action map", { withActions: true }],
  [
    "empty and unfiltered",
    { data: [], meta: { isEmpty: true, isFiltered: false } }
  ],
  [
    "empty under a filter",
    { data: [], meta: { isEmpty: true, isFiltered: true } }
  ],
  [
    "a rejected criteria's verdict beside the rows",
    {
      contextError: {
        status: 422,
        message: "error.query_validation_failed",
        data: [{ keyword: "enum", instancePath: "/sort/0/field" }]
      }
    }
  ],
  [
    "the ordering, the picker and the refinements the module declares",
    { withActions: true, table: declared, criteria }
  ],
  [
    "the same controls, locked by a replay",
    { withActions: true, table: declared, criteria, locked: true }
  ]
];

/** A second locale for the SAME keys, derived from the catalogue rather than written. */
const pseudo = (node: unknown): unknown => {
  if (typeof node === "string") return `⟦${node}⟧`;
  if (!isObject(node)) return node;
  return mapValues(node as Record<string, unknown>, pseudo);
};

const PSEUDO_LOCALE = "xx";
const PSEUDO_SHAPE = /^⟦.*⟧$/;

const flippable = () =>
  createI18n({
    legacy: false,
    locale: "en",
    messages: {
      en: CATALOGUES,
      [PSEUDO_LOCALE]: pseudo(CATALOGUES) as typeof CATALOGUES
    }
  });

/** Every rendered string the shipped catalogue accounts for — the labels. */
const labelsOf = (wrapper: ReturnType<typeof mountList>) =>
  filter(renderedStrings(wrapper), value => TRANSLATED.has(value));

const rowElements = (wrapper: ReturnType<typeof mountList>) =>
  map(wrapper.findAll("tbody tr"), row => row.element);

// -----------------------------------------------------------------------------

describe("the list surface renders no RAW i18n key in any state (Task 49)", () => {
  it.each(STATES)("%s", (_name, options) => {
    const wrapper = mountList(options);

    // An empty `[]` is what a state that drew NOTHING reports too, so each
    // state states what it put on screen before it is measured.
    expect(labelsOf(wrapper).length).toBeGreaterThan(0);
    expect(rawKeys(renderedStrings(wrapper))).toEqual([]);
  });
});

describe("the list surface renders no HARDCODED string in any state (W-D19/FB4)", () => {
  it.each(STATES)("%s", (_name, options) => {
    const wrapper = mountList(options);

    expect(labelsOf(wrapper).length).toBeGreaterThan(0);
    expect(untranslated(renderedStrings(wrapper), dataDerived)).toEqual([]);
  });
});

describe("a locale change restates the list in place (AC5)", () => {
  it("relabels every string it drew, and keeps the very same row elements", async () => {
    const i18n = flippable();
    const wrapper = mountList(
      { withActions: true, table: declared, criteria },
      [i18n as unknown as I18n]
    );

    const before = labelsOf(wrapper);
    const rowsBefore = rowElements(wrapper);
    expect(before.length).toBeGreaterThan(0);
    expect(rowsBefore).toHaveLength(rows.length);

    i18n.global.locale.value = PSEUDO_LOCALE;
    await nextTick();

    const after = renderedStrings(wrapper);
    expect(intersection(after, before)).toEqual([]);
    expect(
      filter(after, value => PSEUDO_SHAPE.test(value)).length
    ).toBeGreaterThanOrEqual(before.length);

    const rowsAfter = rowElements(wrapper);
    expect(rowsAfter).toHaveLength(rowsBefore.length);
    forEach(rowsBefore, (row, index) => expect(rowsAfter[index]).toBe(row));
  });
});

describe("the sweep itself can fail", () => {
  it("sees a hardcoded string and a raw key when one is present", () => {
    const wrapper = mount({
      template: `<div><span>Definitely Not Translated</span><span>text.some_key</span></div>`
    });

    const strings = renderedStrings(wrapper);
    expect(untranslated(strings, dataDerived)).toEqual([
      "Definitely Not Translated"
    ]);
    expect(rawKeys(strings)).toEqual(["text.some_key"]);
  });

  it("sees a raw key from the playground's own namespace too, now that it is swept", () => {
    const wrapper = mount({
      template: `<div><span>labs.results</span></div>`
    });

    expect(rawKeys(renderedStrings(wrapper))).toEqual(["labs.results"]);
    expect(KEY_SHAPE.test("labs.results")).toBe(true);
  });

  it("counts a real catalogue value as translated, so the bar is the catalogue and not a blanket pass", () => {
    expect(TRANSLATED.has(textCatalogue.collection_empty)).toBe(true);
    expect(untranslated([textCatalogue.collection_empty])).toEqual([]);
  });

  /**
   * The interpolation allowance is where a sweep like this goes blind: an
   * INTERPOLATING template matched with its placeholders widened licences every
   * sentence of the same shape, so `"Save {value}"` would pass a hardcoded
   * `"Save changes"` — the very failure AC1/AC3/AC13 exist to red.
   */
  it("sees a hardcoded string wearing an interpolating template's shape, while that template's own output still reads as copy", () => {
    const hardcoded = "Save changes";
    const wrapper = mount({
      template: `<div><span>${hardcoded}</span><span>{{ $t("text.pagination_info", { page: 1, pages: 2 }) }}</span></div>`
    });

    const strings = renderedStrings(wrapper);

    expect(strings).not.toContain(textCatalogue.pagination_info);
    expect(untranslated(strings, dataDerived)).toEqual([hardcoded]);
  });
});
