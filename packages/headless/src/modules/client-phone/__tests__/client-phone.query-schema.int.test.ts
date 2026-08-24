// -----------------------------------------------------------------------------
/**
 * @fileoverview client-phone — the query schema's refusal surface (AC-39, AC-42)
 *
 * ## Job To Be Done
 * A request state that cannot be spelled against the declared schema is
 * refused before any request goes out, and — where the schema's declared
 * `enum` genuinely rejects the value (proven here on `sort`, whose `field`
 * and `dir` are closed enums, `additionalProperties: false`) — the rejection
 * lands in the SAME captured error a consumer already reads for every other
 * kind of failure, never a second, parallel channel; the live criteria stays
 * exactly as it was (commit-whole-or-not-at-all).
 *
 * The free-text `filters.number` branch predates this story and stays
 * UNCHANGED (design.md §2.2); it declares no `additionalProperties: false`,
 * so an unknown `filters` key is compacted away rather than raised as a
 * schema error. Proven here as its own, narrower claim: the wire and the
 * standing list are exactly as unaffected as the enum-rejected case, without
 * over-claiming an error state that branch does not raise. See the
 * hand-off's `wire_proofs`/notes for this distinction.
 *
 * ## What Breaks If These Fail
 * A request the schema cannot express either 500s the whole collection on
 * the wire, or fails with no readable state — the consumer cannot tell a
 * refused write from one that is simply still loading.
 */

import { describe, expect, it, vi } from "vitest";
import { useClientPhones } from "..";
import { observeRequests } from "../../../__tests__/criteria-int-kit";
import { SortDirection } from "../../query/query.types";
import {
  installPhonesHandler,
  seedClientSession
} from "./client-phone.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

async function bootCollection(): Promise<ReturnType<typeof useClientPhones>> {
  const { clientId } = await seedClientSession();
  installPhonesHandler(server, clientId);
  const phones = useClientPhones();
  await phones.useActions().isReady();
  return phones;
}

// -----------------------------------------------------------------------------

describe("client-phone — a request state I cannot spell is refused, not sent (AC-39)", () => {
  it("an undeclared filter column reaches no wire param and leaves the standing list and filters unchanged", async () => {
    const phones = await bootCollection();
    const standingIds = phones.useContext().data.value.map(phone => phone.id);
    const observed = observeRequests(server, "/phones");

    phones.useActions().filterBy({ country: { eq: "GB" } } as never);

    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();

    expect(
      observed
        .all()
        .flatMap(request =>
          [...new URL(request.url).searchParams.keys()].filter(key =>
            key.startsWith("filter[country")
          )
        )
    ).toEqual([]);
    expect(phones.useContext().data.value.map(phone => phone.id)).toEqual(
      standingIds
    );
    expect(phones.useContext().query.value.filters).toBeUndefined();
  });

  it("an undeclared sort field is rejected against the schema's closed enum, reaches no wire param, and the last committed order stays standing", async () => {
    const phones = await bootCollection();
    const observed = observeRequests(server, "/phones");

    phones
      .useActions()
      .sortBy([{ field: "created_at", dir: SortDirection.DESC }]);
    await vi.waitFor(() =>
      expect(observed.lastParam("order")).toBe("-created_at")
    );

    phones.useActions().sortBy([{ field: "phone", dir: SortDirection.ASC }]);
    await new Promise(resolve => setTimeout(resolve, 250));
    observed.stop();

    expect(observed.lastParam("order")).toBe("-created_at");
    expect(phones.useContext().query.value.sort).toEqual([
      { field: "created_at", dir: SortDirection.DESC }
    ]);
  });
});

describe("client-phone — a rejected request state surfaces where every other failure does (AC-42)", () => {
  it("lands a schema-enum rejection (an undeclared sort field) in the collection's own captured error", async () => {
    const phones = await bootCollection();
    expect(phones.useContext().error.value).toBeUndefined();

    phones.useActions().sortBy([{ field: "phone", dir: SortDirection.ASC }]);

    await vi.waitFor(() =>
      expect(phones.useContext().error.value).toBeDefined()
    );
  });
});

// -----------------------------------------------------------------------------

describe("client-phone — the filter-bar uischema over the query schema (F5)", () => {
  it("F5 offers a FilterBar with Controls for search and default filters only", async () => {
    const phones = await bootCollection();
    const { schemas } = phones.useContext();

    expect(schemas.query.uischema).toMatchObject({
      type: "FilterBar",
      elements: [
        {
          type: "Control",
          scope: "#/properties/filters/properties/number/properties/like",
          i18n: "form.phone_search",
          options: { format: "search", noLabel: true, optionalText: "" }
        },
        {
          type: "Control",
          scope: "#/properties/filters/properties/default/properties/eq",
          i18n: "form.default_filter",
          options: { format: "button-group", noLabel: true, optionalText: "" }
        }
      ]
    });
  });

  it("F5 verified filter is absent from FilterBar (no verified capability)", async () => {
    const phones = await bootCollection();
    const { schemas } = phones.useContext();
    const elements = schemas.query.uischema?.elements ?? [];

    const verifiedControl = elements.find(
      (el: { scope?: string }) =>
        typeof el.scope === "string" && el.scope.includes("/verified/")
    );

    expect(verifiedControl).toBeUndefined();
  });
});
