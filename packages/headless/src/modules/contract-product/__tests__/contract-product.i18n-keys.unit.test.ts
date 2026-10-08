// -----------------------------------------------------------------------------
/**
 * @fileoverview contract-product — the list-page filter copy resolves
 *
 * ## Job To Be Done
 * Every control `useContractProducts().useContext().schemas.query.uischema`
 * lays out cites an `i18n` key, and an exclusive toggle's renderer labels each
 * position from `<key>.<member>`. Prove, off the module's LIVE published
 * uischema, that every cited key and every exclusive-toggle member is real
 * copy in the upload SOURCE
 * (`packages/i18n/src/core/form-en.json`), not a key a renderer would draw raw.
 * `packages/i18n/CLAUDE.md` marks `public/locales` a Localazy DOWNLOAD target,
 * so the source is what proves the copy today.
 *
 * `@proves contract-product.feature:1066` — every filter control on my
 * products page is labelled in words.
 *
 * ## What Breaks If These Fail
 * A filter on the products page draws a raw key such as
 * `form.contract_product_subscription_type.one_time` for its label,
 * placeholder or toggle position instead of copy.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { unref } from "vue";
import { useContractProducts } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import { get, split } from "lodash-es";

const FORM_EN = JSON.parse(
  readFileSync(
    join(import.meta.dirname, "../../../../../i18n/src/core/form-en.json"),
    "utf-8"
  )
) as Record<string, unknown>;

type UiControl = {
  scope: string;
  i18n: string;
  options?: { items?: { member: string }[] };
};

const { schemas } = useContractProducts()
  .as(ScopeActorTypes.CLIENT)
  .useContext();
const controls = (unref(schemas.query.uischema) as { elements: UiControl[] })
  .elements;

const catalogueEntry = (key: string): unknown =>
  get(FORM_EN, split(key, ".").slice(1));

const positions = controls.flatMap(control =>
  (control.options?.items ?? []).map(({ member }) => ({
    key: `${control.i18n}.${member}`
  }))
);

// -----------------------------------------------------------------------------

describe("contract-product — every list-page filter control is labelled in words (AC-1)", () => {
  it("AC-1 lays out filter controls and toggle positions to grade, so this check is not vacuous", () => {
    expect(controls.length).toBeGreaterThan(0);
    expect(positions.length).toBeGreaterThan(0);
  });

  it.each(controls)(
    "AC-1 $i18n resolves to a label or a placeholder for the control at $scope",
    ({ i18n }) => {
      const entry = catalogueEntry(i18n) as
        | { label?: unknown; placeholder?: unknown }
        | undefined;
      const copy = [entry?.label, entry?.placeholder].filter(
        text => typeof text === "string" && text.trim() !== ""
      );

      expect(copy.length).toBeGreaterThan(0);
    }
  );

  it.each(positions)(
    "AC-1 the toggle position $key resolves to copy",
    ({ key }) => {
      const copy = catalogueEntry(key);

      expect(copy).toStrictEqual(expect.stringMatching(/\S/));
    }
  );
});
