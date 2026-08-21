/**
 * @module form/renderers/__tests__/filter-tristate
 * @description The tri-state's three states on the MODEL, for both controls:
 * `true`, `false`, and the `null` the schema declares a MEMBER rather than an
 * absence. Selecting a position writes that position's own value; returning to
 * unset writes `null`, which is what the criteria translator reads as "no
 * filter" (proven end to end in `filter-wire.test.ts`).
 *
 * The two controls reach unset differently — the button group draws the unset
 * position, the toggle group reaches it by re-pressing the pressed one — and
 * both must land on the same model. The re-press is the fragile one: radix
 * publishes `undefined` there, and a control that read that as "no value given"
 * would fall to the first option instead of clearing.
 *
 * Negative control: `filter-tristate.must-fail.patch`.
 */

import { describe, expect, it } from "vitest";
import {
  catalogue,
  clientEmailQuery,
  mountFilters,
  positionAt,
  positionNamed,
  positionValuesOf,
  positionsOf,
  pressedIn,
  pressedValuesIn
} from "./filter.harness";
import { get } from "lodash-es";
import type { QueryModel } from "./filter.harness";

const BUTTON_GROUP = "filters.verified.eq";
const TOGGLE_GROUP = "filters.bounced.eq";
const SEARCH = "filters.email.like";

const TRUE = "true";
const FALSE = "false";

const VERIFIED_TRUE = catalogue("form.verified_filter.true");
const VERIFIED_FALSE = catalogue("form.verified_filter.false");
const VERIFIED_UNSET = catalogue("form.verified_filter.null");
const BOUNCED_TRUE = catalogue("form.bounced_filter.true");
const BOUNCED_FALSE = catalogue("form.bounced_filter.false");

const shipped = (model?: QueryModel) =>
  mountFilters({ ...clientEmailQuery(), model });

const leafOf = (model: QueryModel, column: string) =>
  get(model, ["filters", column, "eq"]);

describe("the control that draws its unset position", () => {
  it("draws all three of the schema's members, unset among them", async () => {
    const { column } = await shipped();

    expect(positionsOf(column(BUTTON_GROUP))).toEqual([
      VERIFIED_TRUE,
      VERIFIED_FALSE,
      VERIFIED_UNSET
    ]);
  });

  it("stands on the unset position before anything is filtered, writing no value", async () => {
    const { column, model } = await shipped();

    expect(pressedIn(column(BUTTON_GROUP))).toEqual([VERIFIED_UNSET]);
    expect(leafOf(model(), "verified")).toBeUndefined();
  });

  it("writes the position's own value on each of the two set positions", async () => {
    const { column, model, settle } = await shipped();

    await positionNamed(column(BUTTON_GROUP), VERIFIED_TRUE).trigger("click");
    await settle();
    expect(leafOf(model(), "verified")).toBe(true);

    await positionNamed(column(BUTTON_GROUP), VERIFIED_FALSE).trigger("click");
    await settle();
    expect(leafOf(model(), "verified")).toBe(false);
  });

  it("clears the filter to null when the unset position is chosen back", async () => {
    const { column, model, settle } = await shipped();

    await positionNamed(column(BUTTON_GROUP), VERIFIED_FALSE).trigger("click");
    await settle();
    await positionNamed(column(BUTTON_GROUP), VERIFIED_UNSET).trigger("click");
    await settle();

    expect(leafOf(model(), "verified")).toBeNull();
    expect(pressedIn(column(BUTTON_GROUP))).toEqual([VERIFIED_UNSET]);
  });
});

describe("the control that reaches unset by re-pressing", () => {
  it("draws only the two set positions, because the re-press is the unset", async () => {
    const { column } = await shipped();

    expect(positionsOf(column(TOGGLE_GROUP))).toEqual([
      BOUNCED_TRUE,
      BOUNCED_FALSE
    ]);
    expect(positionValuesOf(column(TOGGLE_GROUP))).toEqual([TRUE, FALSE]);
  });

  it("writes the position's own value when a position is pressed", async () => {
    const { column, model, settle } = await shipped();

    await positionAt(column(TOGGLE_GROUP), TRUE).trigger("click");
    await settle();
    expect(leafOf(model(), "bounced")).toBe(true);

    await positionAt(column(TOGGLE_GROUP), FALSE).trigger("click");
    await settle();
    expect(leafOf(model(), "bounced")).toBe(false);
  });

  it("clears rather than falling to the first position when the pressed one is re-pressed", async () => {
    const { column, model, settle } = await shipped();

    await positionAt(column(TOGGLE_GROUP), FALSE).trigger("click");
    await settle();
    await positionAt(column(TOGGLE_GROUP), FALSE).trigger("click");
    await settle();

    expect(leafOf(model(), "bounced")).toBeNull();
    expect(leafOf(model(), "bounced")).not.toBe(true);
    expect(pressedIn(column(TOGGLE_GROUP))).toEqual([]);
  });
});

describe("the model carries the leaf's own value, never the control's string", () => {
  it("keeps the string conversion at the control's own boundary", async () => {
    const { column, model, settle } = await shipped();

    await positionAt(column(TOGGLE_GROUP), FALSE).trigger("click");
    await settle();

    expect(pressedValuesIn(column(TOGGLE_GROUP))).toEqual([FALSE]);
    expect(leafOf(model(), "bounced")).toBe(false);
  });

  it("clears to the null member rather than an empty string", async () => {
    const { column, model, settle } = await shipped();

    await positionNamed(column(BUTTON_GROUP), VERIFIED_TRUE).trigger("click");
    await positionAt(column(TOGGLE_GROUP), TRUE).trigger("click");
    await settle();

    await positionNamed(column(BUTTON_GROUP), VERIFIED_UNSET).trigger("click");
    await positionAt(column(TOGGLE_GROUP), TRUE).trigger("click");
    await settle();

    expect(leafOf(model(), "verified")).toBeNull();
    expect(leafOf(model(), "bounced")).toBeNull();
  });
});

/**
 * Radix reads `modelValue === undefined` ONCE, at setup, as "uncontrolled". A
 * control that published `undefined` for unset would therefore keep working
 * until the first clear and then stop following the model — a break no
 * first-paint assertion can see, which is why both assertions here come AFTER a
 * clear.
 */
describe("the control still follows the model after a clear", () => {
  it("still follows it on the toggle group", async () => {
    const { column, model, settle } = await shipped();

    await positionAt(column(TOGGLE_GROUP), TRUE).trigger("click");
    await settle();
    await positionAt(column(TOGGLE_GROUP), TRUE).trigger("click");
    await settle();
    await positionAt(column(TOGGLE_GROUP), FALSE).trigger("click");
    await settle();

    expect(leafOf(model(), "bounced")).toBe(false);
    expect(pressedIn(column(TOGGLE_GROUP))).toEqual([BOUNCED_FALSE]);
  });

  it("still follows it on the button group", async () => {
    const { column, model, settle } = await shipped();

    await positionNamed(column(BUTTON_GROUP), VERIFIED_TRUE).trigger("click");
    await settle();
    await positionNamed(column(BUTTON_GROUP), VERIFIED_UNSET).trigger("click");
    await settle();
    await positionNamed(column(BUTTON_GROUP), VERIFIED_FALSE).trigger("click");
    await settle();

    expect(leafOf(model(), "verified")).toBe(false);
    expect(pressedIn(column(BUTTON_GROUP))).toEqual([VERIFIED_FALSE]);
  });
});

describe("a seeded model is on the control at first paint", () => {
  it("presses the position the model names, on both controls", async () => {
    const { column } = await shipped({
      filters: { verified: { eq: false }, bounced: { eq: true } }
    });

    expect(pressedIn(column(BUTTON_GROUP))).toEqual([VERIFIED_FALSE]);
    expect(pressedIn(column(TOGGLE_GROUP))).toEqual([BOUNCED_TRUE]);
  });
});

describe("a clear is scoped to the column it was asked of", () => {
  it("leaves every sibling column exactly as it stood", async () => {
    const { column, model, settle } = await shipped();

    await positionNamed(column(BUTTON_GROUP), VERIFIED_TRUE).trigger("click");
    await positionAt(column(TOGGLE_GROUP), TRUE).trigger("click");
    await column(SEARCH).find("input").setValue("case");
    await settle();

    await positionNamed(column(BUTTON_GROUP), VERIFIED_UNSET).trigger("click");
    await settle();

    expect(leafOf(model(), "verified")).toBeNull();
    expect(leafOf(model(), "bounced")).toBe(true);
    expect(get(model(), ["filters", "email", "like"])).toBe("case");
  });
});
