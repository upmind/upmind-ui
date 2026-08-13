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
 * in, against the shipped `packages/i18n/src/core` catalogue.
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
 * ## What Breaks If These Fail
 * The one surface the operator opens ships English that Localazy never sees,
 * and the client-emails page reads as broken in every locale but `en`.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import action from "@upmind-automation/i18n/core/action-en.json";
import confirm from "@upmind-automation/i18n/core/confirm-en.json";
import datetime from "@upmind-automation/i18n/core/datetime-en.json";
import error from "@upmind-automation/i18n/core/error-en.json";
import form from "@upmind-automation/i18n/core/form-en.json";
import textCatalogue from "@upmind-automation/i18n/core/text-en.json";
import validation from "@upmind-automation/i18n/core/validation-en.json";
import {
  defaultRow,
  unverifiedRow
} from "../../../../../../tests/support/recorded-emails";
import { renderedStrings } from "../../../../../../tests/support/rendered";
import clientEmails from "../../../../useClientEmails/client-email.scenario";
import { ListSurface } from "../index";
import {
  difference,
  flatMap,
  isObject,
  keys,
  map,
  reject,
  split,
  trim,
  uniq,
  values
} from "lodash-es";

// -----------------------------------------------------------------------------

const CATALOGUES = {
  action,
  confirm,
  datetime,
  error,
  form,
  text: textCatalogue,
  validation
};

/** Every leaf string the catalogue can put on screen, pipe branches included. */
function catalogueStrings(node: unknown): string[] {
  if (typeof node === "string") return map(split(node, "|"), trim);
  if (!isObject(node)) return [];
  return flatMap(values(node), catalogueStrings);
}

const TRANSLATED = new Set(catalogueStrings(CATALOGUES));

/** `text.foo` / `action.bar_baz` — a key that reached the DOM untranslated. */
const KEY_SHAPE = new RegExp(`^(${keys(CATALOGUES).join("|")})\\.[a-z0-9_.]+$`);

/** Digits, punctuation and separators carry no copy. */
const CARRIES_NO_COPY = /^[\s\d.,:/|()%+-]*$/;

/** The debug `<pre>` dumps the error PAYLOAD verbatim — data, not authored copy. */
const SERIALISED_PAYLOAD = /^[{[]/;

/** The capture run's own records — the rows the declared columns draw from. */
const rows = [defaultRow, unverifiedRow];

/** Values that came out of the RECORDING; copy is what is left over. */
const dataDerived = uniq(flatMap(rows, row => [row.id, row.email]));

/**
 * Every rendered string that is neither translated, nor data, nor punctuation —
 * a raw key excluded, since that is the OTHER failure and has its own assertion.
 */
const untranslated = (strings: string[]) =>
  uniq(
    reject(
      difference(strings, dataDerived),
      value =>
        TRANSLATED.has(value) ||
        CARRIES_NO_COPY.test(value) ||
        SERIALISED_PAYLOAD.test(value) ||
        KEY_SHAPE.test(value)
    )
  );

function mountList(overrides: {
  data?: unknown[];
  meta?: Record<string, unknown>;
  contextError?: unknown;
  withActions?: boolean;
}) {
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
      presentation: clientEmails.presentation
    }
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
  ]
];

// -----------------------------------------------------------------------------

describe("the list surface renders no RAW i18n key in any state (Task 49)", () => {
  it.each(STATES)("%s", (_name, options) => {
    const raw = renderedStrings(mountList(options)).filter(value =>
      KEY_SHAPE.test(value)
    );

    expect(raw).toEqual([]);
  });
});

describe("the list surface renders no HARDCODED string in any state (W-D19/FB4)", () => {
  it.each(STATES)("%s", (_name, options) => {
    expect(untranslated(renderedStrings(mountList(options)))).toEqual([]);
  });
});

describe("the sweep itself can fail", () => {
  it("sees a hardcoded string and a raw key when one is present", () => {
    const wrapper = mount({
      template: `<div><span>Definitely Not Translated</span><span>text.some_key</span></div>`
    });

    const strings = renderedStrings(wrapper);
    expect(untranslated(strings)).toEqual(["Definitely Not Translated"]);
    expect(strings.filter(value => KEY_SHAPE.test(value))).toEqual([
      "text.some_key"
    ]);
  });

  it("counts a real catalogue value as translated, so the bar is the catalogue and not a blanket pass", () => {
    expect(TRANSLATED.has(textCatalogue.collection_empty)).toBe(true);
    expect(untranslated([textCatalogue.collection_empty])).toEqual([]);
  });
});
