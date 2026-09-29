/**
 * @fileoverview useContracts — the contracts list's full criteria surface
 * (AC-14 under ruling R38) and the contracts picker (R38 item 7)
 *
 * ## Job To Be Done
 * Ruling R38 supersedes R28/R32's pagination-only list: `useContracts` carries
 * the template's filters, sort and pagination through ONE criteria schema, and
 * publishes a `schemas.contractPicker` pair that `useContract` draws on when
 * it has no id. Drive the REAL collection against RECORDED staging captures
 * and prove a client can narrow, clear, order and page their contracts; that
 * the list starts oldest first with no assumed page position; that the schema
 * refuses a criterion it does not declare; that a failed list read is
 * reported; and that a picked contract is the one the manager opens.
 *
 * ## Provenance
 * Every list body is a recorded `pnpm fixtures:generate contract` capture —
 * `recorded.list()`, `recorded.namedFirst()`, `recorded.listFailure()`. The
 * schemas asserted are the module's own published output, read off the live
 * context.
 *
 * ## What Breaks If These Fail
 * A client's narrowing or ordering never reaches the request, the list lies
 * about being narrowed, a hand-rolled criterion rides beside the channel, a
 * failed read shows an empty list instead of an error, or picking a contract
 * opens a different one.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { unref } from "vue";
import { ContractStatusCodes } from "@upmind-automation/types";
import { useContract, useContracts } from "..";
import { SortDirection } from "../../query";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installBackgroundStubs,
  recorded,
  seedClientSession
} from "./contract.int-helpers";
import { server } from "./setup.integration";
import { useValidation } from "../../../utils";
import type { ErrorObject } from "ajv";

// -----------------------------------------------------------------------------

type Validator = ((data: unknown) => boolean) & {
  errors?: ErrorObject[] | null;
};

function compile(schema: unknown): Validator {
  const { ajv } = useValidation() as unknown as {
    ajv: { compile: (schema: object) => Validator };
  };
  return ajv.compile(schema as object);
}

async function bootCollectionObservingUrls() {
  await seedClientSession();
  installBackgroundStubs();
  const urls: string[] = [];
  server?.use(
    http.get("*/contracts", ({ request }) => {
      urls.push(request.url);
      return HttpResponse.json(recorded.list(), { status: 200 });
    })
  );
  const collection = useContracts().as(ScopeActorTypes.CLIENT);
  await collection.useActions().isReady();
  return { collection, urls };
}

function latestParams(urls: string[]): URLSearchParams {
  return new URL(urls[urls.length - 1]!).searchParams;
}

function filterKeys(params: URLSearchParams): string[] {
  return [...params.keys()].filter(key => key.startsWith("filter["));
}

async function publishedQuerySchema() {
  const { collection } = await bootCollectionObservingUrls();
  return unref(collection.useContext().schemas.query.schema);
}

// -----------------------------------------------------------------------------

describe("useContracts — I narrow, clear and order my contracts (AC-14, R38)", () => {
  it("AC-14 narrowing by name and state reaches the request and the query, and I am told my list is narrowed", async () => {
    const { collection, urls } = await bootCollectionObservingUrls();
    expect(collection.useMeta().isFiltered.value).toBe(false);

    collection.useActions().filterBy({
      name: { like: "hosting" },
      "status.code": [ContractStatusCodes.ACTIVE, ContractStatusCodes.SUSPENDED]
    });

    await vi.waitFor(() => {
      expect(latestParams(urls).get("filter[name|like]")).toContain("hosting");
    });
    const status = latestParams(urls).get("filter[status.code]") ?? "";
    expect(status).toContain(ContractStatusCodes.ACTIVE);
    expect(status).toContain(ContractStatusCodes.SUSPENDED);
    expect(collection.useContext().query.value.filters?.name?.like).toBe(
      "hosting"
    );
    expect(collection.useMeta().isFiltered.value).toBe(true);
  });

  it("AC-14 clearing the narrowing stops telling me my list is narrowed, and leaves no filter standing", async () => {
    const { collection, urls } = await bootCollectionObservingUrls();
    collection.useActions().filterBy({
      "status.code": [ContractStatusCodes.ACTIVE]
    });
    await vi.waitFor(() => {
      expect(collection.useMeta().isFiltered.value).toBe(true);
      expect(filterKeys(latestParams(urls))).toContain("filter[status.code]");
    });

    collection.useActions().filterBy({});

    await vi.waitFor(() => {
      expect(collection.useMeta().isFiltered.value).toBe(false);
    });
    expect(collection.useContext().query.value.filters).toBeUndefined();
  });

  it("AC-14 narrowing by order number and total (legacy's order and total filters) validates and reaches the request", async () => {
    const { collection, urls } = await bootCollectionObservingUrls();
    const validate = compile(
      unref(collection.useContext().schemas.query.schema)
    );
    expect(
      validate({
        filters: { main_invoice_number: "QAT-INV-03585", total_amount: 60 }
      })
    ).toBe(true);

    collection.useActions().filterBy({
      main_invoice_number: "QAT-INV-03585",
      total_amount: 60
    });

    await vi.waitFor(() => {
      expect(latestParams(urls).get("filter[main_invoice_number]")).toBe(
        "QAT-INV-03585"
      );
    });
    expect(latestParams(urls).get("filter[total_amount]")).toBe("60");
    expect(
      collection.useContext().query.value.filters?.main_invoice_number
    ).toBe("QAT-INV-03585");
    expect(collection.useContext().query.value.filters?.total_amount).toBe(60);
  });

  it("AC-14 the quick search reaches the request as `query=` and the query holds it", async () => {
    const { collection, urls } = await bootCollectionObservingUrls();

    collection.useActions().setCriteria({ query: "QAT" });

    await vi.waitFor(() => {
      expect(latestParams(urls).get("query")).toBe("QAT");
    });
    expect(collection.useContext().query.value.query).toBe("QAT");
  });

  it("AC-14 ordering by next due date, latest first, reaches the request and the query", async () => {
    const { collection, urls } = await bootCollectionObservingUrls();

    collection
      .useActions()
      .sortBy([{ field: "next_due_date", dir: SortDirection.DESC }]);

    await vi.waitFor(() => {
      expect(latestParams(urls).get("order")).toBe("-next_due_date");
    });
    expect(collection.useContext().query.value.sort).toEqual([
      { field: "next_due_date", dir: SortDirection.DESC }
    ]);
    expect(filterKeys(latestParams(urls))).toEqual([]);
  });
});

describe("useContracts — what my list asks for before I choose anything (AC-14, R38)", () => {
  it("AC-14 my contracts are first asked for oldest first", async () => {
    const { collection, urls } = await bootCollectionObservingUrls();

    expect(urls.length).toBeGreaterThan(0);
    expect(new URL(urls[0]!).searchParams.get("order")).toBe("created_at");

    const model: Record<string, unknown> = {};
    const validate = compile(
      unref(collection.useContext().schemas.query.schema)
    );
    expect(validate(model)).toBe(true);
    expect(model.sort).toEqual([
      { field: "created_at", dir: SortDirection.ASC }
    ]);
  });

  it("AC-14 an order I empty falls back to oldest first", async () => {
    const { collection, urls } = await bootCollectionObservingUrls();
    collection
      .useActions()
      .sortBy([{ field: "next_due_date", dir: SortDirection.DESC }]);
    await vi.waitFor(() => {
      expect(latestParams(urls).get("order")).toBe("-next_due_date");
    });

    collection.useActions().sortBy([]);

    await vi.waitFor(() => {
      expect(collection.useContext().query.value.sort).toEqual([
        { field: "created_at", dir: SortDirection.ASC }
      ]);
    });
  });

  it("AC-14 an unpicked page settles a page size and assumes no page position of its own", async () => {
    const schema = await publishedQuerySchema();
    const model: { pagination: Record<string, unknown> } = { pagination: {} };

    expect(compile(schema)(model)).toBe(true);
    expect(model.pagination.limit).toBe(10);
    expect(Object.keys(model.pagination)).not.toContain("offset");
  });
});

describe("useContracts — the criteria schema owns every criterion (AC-14, R38)", () => {
  it("AC-14 a criterion the list does not declare is refused, and every declared one is accepted", async () => {
    const validate = compile(await publishedQuerySchema());

    expect(
      validate({
        filters: {
          name: { like: "hosting" },
          "status.code": [ContractStatusCodes.ACTIVE],
          created_at: { gte: "2025-01-01T00:00:00Z", lte: null },
          next_due_date: { gte: null, lte: "2026-01-01T00:00:00Z" }
        },
        sort: [{ field: "total_amount", dir: SortDirection.DESC }],
        pagination: { limit: 20, offset: 20 }
      })
    ).toBe(true);

    expect(
      validate({
        pagination: { limit: 10 },
        "filter[status.code]": ContractStatusCodes.ACTIVE
      })
    ).toBe(false);
    expect(validate.errors?.[0]?.keyword).toBe("additionalProperties");
  });
});

describe("useContracts — a failed list read is reported (AC-14, R38 item 6)", () => {
  it("AC-14 when my contracts cannot be read I am told my list has an error, with the reason the read returned", async () => {
    await seedClientSession();
    installBackgroundStubs();
    const failure = recorded.listFailure().response;
    server?.use(
      http.get("*/contracts", () =>
        HttpResponse.json(failure.body as Record<string, unknown>, {
          status: failure.status
        })
      )
    );

    const collection = useContracts().as(ScopeActorTypes.CLIENT);
    await collection
      .useActions()
      .isReady()
      .catch(() => undefined);

    await vi.waitFor(() => {
      expect(collection.useMeta().hasError.value).toBe(true);
    });
    const reason = (failure.body as { error: { message: string } }).error
      .message;
    expect(JSON.stringify(collection.useContext().error.value)).toContain(
      reason
    );
    expect(collection.useContext().data.value).toEqual([]);
  });
});

/**
 * `@proves contract.feature:469` — the picked option's value is the id the
 * manager loads by.
 *
 * The recorded page (`recorded.namedFirst()`, ordered `-name`) holds only
 * unnamed contracts, so a name-derived value cannot differ from the id here.
 * `contract.contracts-picker.test.ts` pins the named case.
 */
describe("useContracts — the contracts picker (R38 item 7)", () => {
  it("Picking one of my contracts opens that very contract", async () => {
    await seedClientSession();
    installBackgroundStubs();
    const page = recorded.namedFirst();
    const managerReads: string[] = [];
    const lookupUrls: string[] = [];
    server?.use(
      http.get("*/contracts", ({ request }) => {
        lookupUrls.push(request.url);
        return HttpResponse.json(page, { status: 200 });
      }),
      http.get("*/contracts/:id", ({ params }) => {
        managerReads.push(String(params.id));
        const refusal = recorded.readNotFound().response;
        return HttpResponse.json(refusal.body as Record<string, unknown>, {
          status: refusal.status
        });
      })
    );

    const collection = useContracts().as(ScopeActorTypes.CLIENT);
    const uischema = unref(
      collection.useContext().schemas.contractPicker.uischema
    ) as {
      elements: {
        scope: string;
        options: {
          lookup: {
            searchScope: string;
            service: () => {
              data: unknown;
              setCriteria: (model: { query: string }) => void;
            };
          };
        };
      }[];
    };
    const control = uischema.elements[0]!;
    expect(control.scope).toBe("#/properties/contract");
    // The typed term is written into the `query` criterion — the platform
    // quick search that narrows title, name and order number alike (G1), not a
    // `filter[name|like]` branch a nameless contract never matches.
    expect(control.options.lookup.searchScope).toBe("query");

    const lookup = control.options.lookup.service();
    await vi.waitFor(() => {
      expect(
        (unref(lookup.data) as { value: string }[] | undefined)?.length
      ).toBe(page.data.length);
    });

    // A term typed into the picker narrows through that same `query` channel.
    lookup.setCriteria({ query: "QAT" });
    await vi.waitFor(() => {
      expect(
        lookupUrls.some(url => new URL(url).searchParams.get("query") === "QAT")
      ).toBe(true);
    });
    const options = unref(lookup.data) as { value: string }[];
    expect(options.map(option => option.value)).toEqual(
      page.data.map(row => row.id)
    );

    const picked = options[1]!.value;
    const manager = useContract().as(ScopeActorTypes.CLIENT).withId(picked);
    await manager
      .useActions()
      .isReady()
      .catch(() => undefined);

    await vi.waitFor(() => {
      expect(managerReads).toContain(picked);
    });
    expect(managerReads.every(id => id === picked)).toBe(true);
  });
});
