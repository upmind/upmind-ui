// -----------------------------------------------------------------------------
/**
 * @fileoverview query criteria — the dual-source defect is a COMPILE error (W-D7, Task 42/44)
 *
 * ## Job To Be Done
 * W-11's defect is that a caller can spell the request branches raw AND declare
 * a criteria that owns them, leaving two sources of truth for one state with no
 * gate between them. W-D7 asked for that to be structurally impossible rather
 * than documented, so the proof is a TYPE proof: every construct below that
 * carries an `@ts-expect-error` MUST fail to compile, and every construct
 * without one MUST still compile.
 *
 * It is self-falsifying in both directions. If the union arms collapse back
 * into an intersection, the errors stop and TypeScript reports every directive
 * as `TS2578: Unused '@ts-expect-error' directive` — attributed to this file.
 * If a raw caller is broken by the change, the un-marked constructs error —
 * also attributed to this file. Either way the gate below goes from zero to
 * non-zero.
 *
 * ## The gate (this file is never executed — `.no-test.ts`)
 * ```bash
 * cd packages/headless
 * npx vue-tsc -p tsconfig.testcheck.json --noEmit 2>&1 \
 *   | grep -c "query-criteria.types.no-test"      # MUST be 0
 * ```
 * `tsconfig.testcheck.json` is the only tsconfig in the package that includes
 * `__tests__`; the tree carries 60 pre-existing errors in other files, so the
 * gate is this file's OWN error count, not the exit code.
 *
 * ## What Breaks If This Fails
 * `list({ criteria, filters })` compiling again is the shadow-copy drift Wave A
 * removed, re-admitted at the type level where no test can see it: the criteria
 * says one thing, the raw branch says another, and whichever the implementation
 * happens to read last wins.
 */

import { RequestSortDirection } from "../query.types";
import { useQuery } from "../useQuery";
import type { JsonSchema } from "@jsonforms/core";

// -----------------------------------------------------------------------------

type Model = {
  filters?: { verified?: { eq?: boolean } };
  sort?: { field: string; dir: "asc" | "desc" }[];
  pagination?: { limit?: number; offset?: number };
};

const schema: JsonSchema = {
  type: "object",
  properties: {
    filters: {
      type: "object",
      properties: {
        verified: {
          type: "object",
          properties: { eq: { type: "boolean" } }
        }
      }
    }
  }
};

const rawFilters = { "filter[verified|eq]": "0" };
const rawSort: [RequestSortDirection, string] = [
  RequestSortDirection.DESC,
  "created_at"
];
const rawPagination = { limit: 10, offset: 0 };

// -----------------------------------------------------------------------------

/** A caller DECLARING the branches — the criteria owns them, and only it does. */
export function declaredCallersCompile(url: URL): void {
  const { list, query, listInfinite } = useQuery();
  const seed: Partial<Model> = { pagination: { limit: 10 } };

  list<unknown[]>({ url, queryKey: ["types"], criteria: { schema } });
  list<unknown[]>({
    url,
    queryKey: ["types"],
    criteria: { schema, model: seed }
  });
  query({ url, queryKey: ["types"], criteria: { schema } });
  listInfinite({ url, queryKey: ["types"], criteria: { schema } });
}

/** Every raw call site in the tree today — untouched by the union. */
export function rawCallersStillCompile(url: URL): void {
  const { list, query, listInfinite } = useQuery();

  list<unknown[]>({
    url,
    queryKey: ["types"],
    filters: rawFilters,
    sort: rawSort,
    pagination: rawPagination
  });
  query({ url, queryKey: ["types"], filters: rawFilters, sort: rawSort });
  listInfinite({
    url,
    queryKey: ["types"],
    filters: rawFilters,
    sort: rawSort,
    pagination: rawPagination
  });
}

/** The dual-source defect, one arm per branch per entry point. */
export function dualSourceIsRejected(url: URL): void {
  const { list, query, listInfinite } = useQuery();

  // @ts-expect-error the criteria owns `filters`; spelling it raw beside it is the W-11 defect
  list<unknown[]>({
    url,
    queryKey: ["types"],
    criteria: { schema },
    filters: rawFilters
  });
  // @ts-expect-error the criteria owns `sort`
  list<unknown[]>({
    url,
    queryKey: ["types"],
    criteria: { schema },
    sort: rawSort
  });
  // @ts-expect-error the criteria owns `pagination`
  list<unknown[]>({
    url,
    queryKey: ["types"],
    criteria: { schema },
    pagination: rawPagination
  });

  // @ts-expect-error the criteria owns `filters`
  query({
    url,
    queryKey: ["types"],
    criteria: { schema },
    filters: rawFilters
  });
  // @ts-expect-error the criteria owns `sort`
  query({ url, queryKey: ["types"], criteria: { schema }, sort: rawSort });

  // @ts-expect-error the criteria owns `filters`
  listInfinite({
    url,
    queryKey: ["types"],
    criteria: { schema },
    filters: rawFilters
  });
  // @ts-expect-error the criteria owns `pagination`
  listInfinite({
    url,
    queryKey: ["types"],
    criteria: { schema },
    pagination: rawPagination
  });
}

/** In criteria mode there is ONE write verb; the two raw setters are gone. */
export function criteriaModeHasOneWriteVerb(url: URL): void {
  const { list, listInfinite, query } = useQuery();

  const listed = list<unknown[]>({
    url,
    queryKey: ["types"],
    criteria: { schema }
  });
  listed.setCriteria({ filters: { verified: { eq: false } } });
  // @ts-expect-error `sort()` is removed in criteria mode — a second write path into one state
  listed.sort(rawSort);
  // @ts-expect-error `filter()` is removed in criteria mode
  listed.filter(rawFilters);

  const simple = query({ url, queryKey: ["types"], criteria: { schema } });
  simple.setCriteria({ sort: [{ field: "created_at", dir: "desc" }] });
  // @ts-expect-error `sort()` is removed in criteria mode
  simple.sort(rawSort);

  const infinite = listInfinite({
    url,
    queryKey: ["types"],
    criteria: { schema }
  });
  infinite.setCriteria({ pagination: { limit: 2 } });
  // @ts-expect-error `filter()` is removed in criteria mode
  infinite.filter(rawFilters);
}

/** A raw caller keeps both setters, exactly as before. */
export function rawModeKeepsBothSetters(url: URL): void {
  const listed = useQuery().list<unknown[]>({ url, queryKey: ["types"] });

  listed.sort(rawSort);
  listed.filter(rawFilters);
}

export type QueryCriteriaTypeContract = [
  typeof declaredCallersCompile,
  typeof rawCallersStillCompile,
  typeof dualSourceIsRejected,
  typeof criteriaModeHasOneWriteVerb,
  typeof rawModeKeepsBothSetters
];
