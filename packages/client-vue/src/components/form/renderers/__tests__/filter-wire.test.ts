/**
 * @module form/renderers/__tests__/filter-wire
 * @description What the controls emit, read by the consumer that actually
 * consumes it: the model each control writes is handed to headless'
 * `translateQuery` with the module's own query schema, and the assertion is on
 * the WIRE key it produces. A control whose write merely looks right — an `eq`
 * the translator turns into the wrong string, or a clear that leaves a value
 * behind — cannot pass here, because nothing in this file asserts the model
 * shape the renderers chose.
 *
 * `false` collapsing to the same wire value as unset is the invisible failure:
 * "show me the ones that did NOT bounce" silently becomes "show me everything".
 *
 * Negative control: `filter-wire.must-fail.patch`.
 */

import { describe, expect, it } from "vitest";
import { translateQuery } from "@upmind-automation/headless";
import {
  catalogue,
  clientEmailQuery,
  mountFilters,
  positionAt,
  positionNamed
} from "./filter.harness";
import { get, values } from "lodash-es";

const { schema, uischema } = clientEmailQuery();

const BUTTON_GROUP = "filters.verified.eq";
const TOGGLE_GROUP = "filters.bounced.eq";
const SEARCH = "filters.email.like";

const VERIFIED_TRUE = catalogue("form.verified_filter.true");
const VERIFIED_FALSE = catalogue("form.verified_filter.false");
const VERIFIED_UNSET = catalogue("form.verified_filter.null");

const VERIFIED = "filter[verified|eq]";
const BOUNCED = "filter[bounced|eq]";
const EMAIL = "filter[email|like]";
const UNSET_ON_THE_WIRE = "";

const drive = async (
  interact: (mount: Awaited<ReturnType<typeof mountFilters>>) => Promise<void>
) => {
  const mount = await mountFilters({ schema, uischema });

  await interact(mount);
  await mount.settle();

  return get(translateQuery(schema, mount.model()), "filters") as
    | Record<string, string>
    | undefined;
};

describe("a chosen position reaches the wire as the API's own value", () => {
  it("wires the button group's true as 1 and its false as 0", async () => {
    expect(
      await drive(({ column }) =>
        positionNamed(column(BUTTON_GROUP), VERIFIED_TRUE).trigger("click")
      )
    ).toMatchObject({ [VERIFIED]: "1" });

    expect(
      await drive(({ column }) =>
        positionNamed(column(BUTTON_GROUP), VERIFIED_FALSE).trigger("click")
      )
    ).toMatchObject({ [VERIFIED]: "0" });
  });

  it("wires the toggle group's true as 1 and its false as 0", async () => {
    expect(
      await drive(({ column }) =>
        positionAt(column(TOGGLE_GROUP), "true").trigger("click")
      )
    ).toMatchObject({ [BOUNCED]: "1" });

    expect(
      await drive(({ column }) =>
        positionAt(column(TOGGLE_GROUP), "false").trigger("click")
      )
    ).toMatchObject({ [BOUNCED]: "0" });
  });

  it("wraps the search term in the translator's own wildcards", async () => {
    expect(
      await drive(({ column }) => column(SEARCH).find("input").setValue("case"))
    ).toMatchObject({ [EMAIL]: "%case%" });
  });
});

describe("returning to unset clears the column on the wire", () => {
  it("empties the key the button group had set", async () => {
    const filters = await drive(async ({ column, settle }) => {
      await positionNamed(column(BUTTON_GROUP), VERIFIED_FALSE).trigger(
        "click"
      );
      await settle();
      await positionNamed(column(BUTTON_GROUP), VERIFIED_UNSET).trigger(
        "click"
      );
    });

    expect(get(filters, VERIFIED)).toBe(UNSET_ON_THE_WIRE);
  });

  it("empties the key the toggle group had set", async () => {
    const filters = await drive(async ({ column, settle }) => {
      await positionAt(column(TOGGLE_GROUP), "false").trigger("click");
      await settle();
      await positionAt(column(TOGGLE_GROUP), "false").trigger("click");
    });

    expect(get(filters, BOUNCED)).toBe(UNSET_ON_THE_WIRE);
  });

  it("empties the key the search box had set", async () => {
    const filters = await drive(async ({ column, settle }) => {
      await column(SEARCH).find("input").setValue("case");
      await settle();
      await column(SEARCH).find("input").setValue("");
    });

    expect(get(filters, EMAIL)).toBe(UNSET_ON_THE_WIRE);
  });

  it("leaves a cleared bar indistinguishable from one never touched", async () => {
    const untouched = await drive(async () => {});
    const cleared = await drive(async ({ column, settle }) => {
      await positionNamed(column(BUTTON_GROUP), VERIFIED_TRUE).trigger("click");
      await positionAt(column(TOGGLE_GROUP), "true").trigger("click");
      await settle();
      await positionNamed(column(BUTTON_GROUP), VERIFIED_UNSET).trigger(
        "click"
      );
      await positionAt(column(TOGGLE_GROUP), "true").trigger("click");
    });

    expect(cleared).toEqual(untouched);
    expect(values(untouched)).toEqual([
      UNSET_ON_THE_WIRE,
      UNSET_ON_THE_WIRE,
      UNSET_ON_THE_WIRE
    ]);
  });
});

describe("a set column and an unset one are never the same string", () => {
  it("keeps false apart from unset on the same key", async () => {
    const off = await drive(({ column }) =>
      positionAt(column(TOGGLE_GROUP), "false").trigger("click")
    );

    expect(get(off, BOUNCED)).not.toBe(UNSET_ON_THE_WIRE);
    expect(get(off, VERIFIED)).toBe(UNSET_ON_THE_WIRE);
  });
});
