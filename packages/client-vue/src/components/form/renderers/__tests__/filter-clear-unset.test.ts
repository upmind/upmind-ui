/**
 * @module form/renderers/__tests__/filter-clear-unset
 * @description The tri-state's CLEAR, on the WIRE rather than on the control
 * (P1-R7): whichever treatment a column draws, returning it to unset must leave
 * the operator leaf carrying nothing at all — a control that merely looks
 * cleared while an `eq` survives is the regression the operator drove into.
 *
 * Negative control: `filter-clear-unset.must-fail.patch`.
 */

import { describe, expect, it } from "vitest";
import {
  useQuerySchema,
  useQueryUischema
} from "@upmind-automation/headless/testing/client-email/internal-kit";
import text from "@upmind-automation/i18n/core/text-en.json";
import {
  mountFilters,
  positionAt,
  pressedIn,
  positionsOf
} from "./filter.harness";
import { get, has, keys, values } from "lodash-es";

const UNSET = "all";
const YES = "yes";
const NO = "no";
const BOUNCED = "true";
const NOT_BOUNCED = "false";

const mount = () =>
  mountFilters({ schema: useQuerySchema(), uischema: useQueryUischema() });

const leafOf = (model: Record<string, unknown>, name: string) =>
  get(model, ["filters", name]);

describe("the labelled treatment's unset position", () => {
  it("stands chosen before anything is filtered, writing no leaf value", async () => {
    const { column, model } = await mount();

    expect(pressedIn(column("verified"))).toEqual([text.all]);
    expect(values(leafOf(model(), "verified") ?? {})).toEqual([]);
  });

  it("writes the position's own value on each of the two set positions", async () => {
    const { column, model, settle } = await mount();

    await positionAt(column("verified"), YES).trigger("click");
    await settle();
    expect(leafOf(model(), "verified")).toEqual({ eq: true });

    await positionAt(column("verified"), NO).trigger("click");
    await settle();
    expect(leafOf(model(), "verified")).toEqual({ eq: false });
  });

  it("empties the leaf when the unset position is chosen back", async () => {
    const { column, model, settle } = await mount();

    await positionAt(column("verified"), NO).trigger("click");
    await settle();
    await positionAt(column("verified"), UNSET).trigger("click");
    await settle();

    expect(keys(leafOf(model(), "verified"))).toEqual([]);
    expect(has(model(), ["filters", "verified", "eq"])).toBe(false);
    expect(pressedIn(column("verified"))).toEqual([text.all]);
  });
});

describe("the label-less treatment's un-press", () => {
  it("writes the state's own value when a position is pressed", async () => {
    const { column, model, settle } = await mount();

    await positionAt(column("bounced"), BOUNCED).trigger("click");
    await settle();
    expect(leafOf(model(), "bounced")).toEqual({ eq: true });

    await positionAt(column("bounced"), NOT_BOUNCED).trigger("click");
    await settle();
    expect(leafOf(model(), "bounced")).toEqual({ eq: false });
  });

  it("empties the leaf when the pressed position is pressed again", async () => {
    const { column, model, settle } = await mount();

    await positionAt(column("bounced"), BOUNCED).trigger("click");
    await settle();
    await positionAt(column("bounced"), BOUNCED).trigger("click");
    await settle();

    expect(keys(leafOf(model(), "bounced"))).toEqual([]);
    expect(has(model(), ["filters", "bounced", "eq"])).toBe(false);
    expect(pressedIn(column("bounced"))).toEqual([]);
  });

  it("offers no unset position, because the un-press is the unset", async () => {
    const { column } = await mount();

    expect(positionsOf(column("bounced"))).toHaveLength(2);
    expect(positionAt(column("bounced"), UNSET).exists()).toBe(false);
  });
});

describe("a clear is scoped to the column it was asked of", () => {
  it("leaves every sibling column's leaf exactly as it stood", async () => {
    const { column, model, settle } = await mount();

    await positionAt(column("verified"), YES).trigger("click");
    await positionAt(column("bounced"), BOUNCED).trigger("click");
    await column("email").find("input").setValue("case");
    await settle();

    await positionAt(column("verified"), UNSET).trigger("click");
    await settle();

    expect(keys(leafOf(model(), "verified"))).toEqual([]);
    expect(leafOf(model(), "bounced")).toEqual({ eq: true });
    expect(leafOf(model(), "email")).toEqual({ like: "case" });
  });
});
