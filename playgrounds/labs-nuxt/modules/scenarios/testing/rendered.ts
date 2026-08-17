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

import { compact, filter, flatMap, map, trim, uniq } from "lodash-es";
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
