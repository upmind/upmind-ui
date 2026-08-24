/**
 * @module tests/support/rendered
 * @description What a mount actually puts in front of a user, as atomic
 * strings — the instrument the i18n sweep measures with.
 *
 * A twin of `packages/client-vue/src/components/form/renderers/__tests__/filter.harness.ts`,
 * duplicated rather than shared because there is no cross-package test module
 * to host it: `@vue/test-utils` is not a root dependency, so a primitive typed
 * against it cannot live outside a package that installs it.
 */

import action from "@upmind-automation/i18n/core/action-en.json";
import confirm from "@upmind-automation/i18n/core/confirm-en.json";
import datetime from "@upmind-automation/i18n/core/datetime-en.json";
import error from "@upmind-automation/i18n/core/error-en.json";
import form from "@upmind-automation/i18n/core/form-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import validation from "@upmind-automation/i18n/core/validation-en.json";
import labs from "@upmind-automation/i18n/modules/labs-en.json";
import {
  compact,
  difference,
  drop,
  escapeRegExp,
  every,
  filter,
  flatMap,
  includes,
  isEmpty,
  isObject,
  keys,
  map,
  reject,
  some,
  split,
  trim,
  uniq,
  values
} from "lodash-es";
import type { DOMWrapper, VueWrapper } from "@vue/test-utils";

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

/**
 * The catalogue a rendered string is measured against — the shipped
 * `packages/i18n/src` namespaces every surface in this playground installs,
 * `labs` included: a mount carrying a table channel renders `DisplayRow`, whose
 * own `labs.*` keys are real copy, and a core-only set would report them as
 * hardcoded English.
 */
export const CATALOGUES = {
  action,
  confirm,
  datetime,
  error,
  form,
  labs,
  text,
  validation
};

/** Every leaf string the catalogue can put on screen, pipe branches included. */
export function catalogueStrings(node: unknown): string[] {
  if (typeof node === "string") return map(split(node, "|"), trim);
  if (!isObject(node)) return [];
  return flatMap(values(node), catalogueStrings);
}

export const TRANSLATED = new Set(catalogueStrings(CATALOGUES));

/** `text.foo` / `labs.bar_baz` — a key that reached the DOM untranslated. */
export const KEY_SHAPE = new RegExp(
  `^(${keys(CATALOGUES).join("|")})\\.[a-z0-9_.]+$`
);

/**
 * Digits, punctuation and separators carry no copy — the em/en dash included:
 * an empty declared cell draws one as a placeholder glyph, which is no more
 * translatable copy than the hyphen beside it in this class.
 */
export const CARRIES_NO_COPY = /^[\s\d.,:/|()%+–—-]*$/;

/** A debug `<pre>` dumps a PAYLOAD verbatim — data, not authored copy. */
export const SERIALISED_PAYLOAD = /^[{[]/;

/**
 * The catalogue's INTERPOLATING values as the shapes they reach the DOM in —
 * `"Page {page} of {pages}"` renders as `"Page 1 of 1"`, which no whole-value
 * match can see. Each placeholder is CAPTURED, never widened away, so what
 * filled it can be held to the sweep's own bar.
 */
const INTERPOLATED = map(
  filter(
    catalogueStrings(CATALOGUES),
    value =>
      /\{[^}]+\}/.test(value) &&
      // A template that is placeholders and punctuation only (`{label}: {value}`)
      // carries no copy of its own, and its widened shape would match any
      // sentence of the same punctuation — including a hardcoded one.
      value.replace(/\{[^}]*\}/g, "").replace(/\s+/g, "").length > 1
  ),
  value =>
    new RegExp(`^${escapeRegExp(value).replace(/\\\{[^{}]*\\\}/g, "(.+)")}$`)
);

/**
 * Interpolation output: a catalogue template whose every gap holds a VALUE —
 * data the recording supplied, digits and punctuation, or catalogue copy in its
 * own right. The gaps are the only part of a template a translator does not
 * ship, so anything else standing in one is authored English, not a value.
 *
 * A bare `.+` gap admits any sentence of the template's shape: `"Save {value}"`
 * licences a hardcoded `"Save changes"`, and `"Filter by {field}"` a hardcoded
 * `"Filter by status"` — the exact failures AC1/AC3/AC13 exist to red.
 */
const interpolates = (value: string, dataDerived: string[]) =>
  some(INTERPOLATED, shape => {
    const gaps = drop(shape.exec(value) ?? [], 1);

    return (
      !isEmpty(gaps) &&
      every(
        gaps,
        gap =>
          CARRIES_NO_COPY.test(gap) ||
          TRANSLATED.has(gap) ||
          includes(dataDerived, gap)
      )
    );
  });

/**
 * Copy a VENDOR primitive ships in English of its own. `reka-ui`'s
 * `PaginationPrev` / `PaginationNext` default their `aria-label`, and
 * `packages/ui`'s `Pagination.ce.vue` passes none — a real finding, in neither
 * this playground nor this repo's authored copy, so it is named here rather
 * than silently widening the bar. Fixing it belongs to `packages/ui`.
 */
const VENDOR_DEFAULTS = new Set(["Previous Page", "Next Page"]);

/**
 * Icon fallback tokens from `@upmind-automation/client-vue` Icon component:
 * when an icon name isn't registered, the component renders `{name} icon` as
 * aria-hidden decorative fallback text. These are never user-facing in
 * production (icons ARE registered there), so they are exempted from the
 * hardcoded-string sweep. Pattern: lowercase-kebab-case optionally followed
 * by a digit suffix, then ` icon`.
 */
const ICON_FALLBACK_SHAPE = /^[a-z][a-z0-9-]* icon$/;

export const rawKeys = (strings: string[]) =>
  filter(strings, value => KEY_SHAPE.test(value));

/**
 * Every rendered string that is neither translated, nor data the recording
 * supplied, nor punctuation — a raw key excluded, since that is the OTHER
 * failure and has its own assertion.
 */
export const untranslated = (strings: string[], dataDerived: string[] = []) =>
  uniq(
    reject(
      difference(strings, dataDerived),
      value =>
        TRANSLATED.has(value) ||
        VENDOR_DEFAULTS.has(value) ||
        ICON_FALLBACK_SHAPE.test(value) ||
        interpolates(value, dataDerived) ||
        CARRIES_NO_COPY.test(value) ||
        SERIALISED_PAYLOAD.test(value) ||
        KEY_SHAPE.test(value)
    )
  );
