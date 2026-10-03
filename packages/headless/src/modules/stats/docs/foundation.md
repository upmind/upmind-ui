# Module: stats

## What it is

The **stats** module covers the numeric summary data behind a client's own dashboard: four independent stat counts — total orders, total invoices, unpaid invoices, and active support tickets — plus a companion read for a partner-usage block that a distinct class of account (an "Upmind-context" account) can see. Every read in this module resolves the currently signed-in client's own identity; there is no capability anywhere in this module to read another client's counts, and no staff-acting path.

The four stat counts are read at full parity with a proven, working platform contract. The partner-usage read currently proves only its **refusal path**: every account reachable while building this documentation answered the endpoint with the same refusal, so this module ships the request and the refusal handling, and the endpoint's success response is **not documented here** — no captured example of it exists to document.

*Any `object_meta` field returned inside a currency-level breakdown row is UI-specific to the originating client — ignore for spec purposes.*

## Core concepts

- **Stat tile** — one of the four independent counts this module reads. Each tile is its own request; none depends on another's result.
- **Currency-summed count** — three of the four tiles read a currency-keyed report and take the pre-summed `"ALL"` key rather than any one currency's own total. The platform computes this sum; the module never sums per-currency rows itself.
- **Report window** — the date range a currency-bound report covers. Every read in this module fixes the end of that window to the day the read happens; there is no capability to query a different window.
- **Absent vs. zero** — a tile can report "nothing to count" two different ways on the wire (see Data shape and Lessons below); this module normalises both to one absent value, and never reports an absent count as a zero or a real zero as absent.
- **Upmind-context account** — a class of account distinguishable only by how the partner-usage endpoint answers it. An ordinary client account gets a refusal; an Upmind-context account is presumed to get something else, but no capture of that "something else" exists to document.

## Operations

| # | Capability | Inputs | Outputs |
| --- | --- | --- | --- |
| 1 | Read the client's total order count | — | a count, or an absent value for the window |
| 2 | Read the client's total invoice count | — | a count, or an absent value for the window |
| 3 | Read the client's unpaid-invoice count (unpaid + overdue) | — | a count, or an absent value for the window |
| 4 | Read the client's active support-ticket count | — | a count, or an absent value for the window |
| 5 | Read the client's partner-usage block | — | a refusal (the only reachable outcome today) |

**Additional always-on behaviours:**

- Reporting whether the caller can address any of these reads at all — an authenticated session with a resolved client identity — and refusing to issue a request when it cannot.
- Reporting per-tile and aggregate loading state, and signalling once every tile read has settled (a signal that always resolves, even when a tile could not be addressed).
- Reporting whether a read failed, distinct from a tile that simply has nothing to count.
- Reporting whether the active-ticket tile should be shown at all — governed by a brand-level support-system setting, read from already-loaded configuration.
- Forcing a fresh re-read of one composable's tiles, and clearing a composable's cached counts.

## Data shape

Every response on this endpoint family is wrapped in the platform's standard envelope:

```ts
type StatsEnvelope<T> = {
  status: "ok" | "error";
  data: T | null;
  related: unknown | null;
  total: number | null; // no separate row count applies to this endpoint family
  error: {
    id: string;
    type: number;
    code: number; // mirrors the HTTP status
    message: string;
    data: unknown[];
  } | null;
  messages: string[] | null;
  meta: null;
};
```

The three currency-bound tiles (orders, invoices, unpaid invoices) each request one report key and read one path off it:

```ts
type CurrencyStatReport = {
  date: { first_date: string; last_date: string };
  result: Record<string, CurrencyStatRow[]>; // keyed by currency code, plus a pre-summed "ALL" key
} | null; // null when the platform has nothing to report for the window

type CurrencyStatRow = {
  count: number;
  // Every per-currency row (a specific currency code's own key, e.g. "GBP")
  // additionally carries that currency's own amount breakdown (totals, paid
  // amount, formatted strings, the currency record itself) — out of scope
  // here. This module reads `count` off the "ALL" key only.
};

type CurrencyStatsData = {
  total: CurrencyStatReport;
  // The platform's response for a currency-bound report additionally carries
  // OTHER named report keys alongside `total` (observed on the orders read:
  // active, awaiting_activation, cancelled, closed, pending, and others) —
  // out of scope: this module requests and reads the `total` key only.
};
```

The one non-currency-bound tile (active tickets) requests one report key and reads one path off it, with no currency dimension at all:

```ts
type TicketStatReport = {
  date: { first_date: string; last_date: string };
  result: TicketStatRow[];
} | null;

type TicketStatRow = { count: number };

type TicketStatsData = {
  open?: TicketStatReport; // present only for the report key(s) actually requested
};
```

The partner-usage endpoint's only observed response is a refusal — see API endpoints below. No success-path data shape is documented; none has been captured.

## Dependencies

### Dependants — modules that read from this one

None today. This module is new; the client-facing dashboard surface that will render these four counts and the usage block is a separate deliverable that has not landed yet.

### This module's own dependencies

- **Active client session** — supplies the acting client's identity and gates every read on being authenticated with a resolved client id. There is no separate "which client" input anywhere in this module.
- **Brand configuration** — a single already-loaded support-system setting gates whether the active-ticket tile should be shown; no second request is made to read it.
- **HTTP transport layer** — bearer-token attachment, URL construction, response caching.

## API endpoints

### GET /stats

Role: returns one named report for the caller's own account, shaped by the `type` query parameter and, for two of the types, further narrowed by `report` and (for the unpaid-invoices tile) `invoice_status`. All four tiles this module reads pin `date_to` to the day of the read; the three currency-bound tiles additionally pin `currency_code=ALL`, so the response's `result` map always carries a pre-summed `"ALL"` key alongside any per-currency keys the account's activity produced. **`report` and `invoice_status`, where sent, are JSON-array text inside a single string query value — not a repeated array-style query key**; sending them as a repeated key answers with a server error.

**Total orders**

```bash
curl "$API/stats?type=contracts&date_to=2026-10-03&currency_code=ALL" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: application/json"
```

Sample response (`200`, trimmed to the `total` report key and to the `"ALL"` row of its result — the response also carries the other named report keys described in Data shape above):

```json
{
  "status": "ok",
  "data": {
    "total": {
      "date": { "first_date": "2025-06-04 09:06:13", "last_date": "2026-10-01 13:38:11" },
      "result": {
        "ALL": [{ "total_amount": 108200.06, "count": 1383 }]
      }
    }
  },
  "related": null,
  "total": null,
  "error": null,
  "messages": [],
  "meta": null
}
```

Fixture: `__tests__/fixtures/get-stats-currency-code-all-date-to-2026-10-03-type-contracts.json`

**Total invoices**

```bash
curl "$API/stats?type=invoices&date_to=2026-10-03&currency_code=ALL" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: application/json"
```

Same envelope and `total`/`"ALL"` shape as total orders, over the account's invoices instead. Fixture: `__tests__/fixtures/get-stats-currency-code-all-date-to-2026-10-03-type-invoices.json`

**Unpaid invoices**

```bash
curl "$API/stats?type=invoices_category&report=%5B%22total%22%5D&invoice_status=%5B%22invoice_unpaid%22%2C%22invoice_overdue%22%5D&date_to=2026-10-03&currency_code=ALL" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: application/json"
```

`report` decodes to `["total"]`; `invoice_status` decodes to `["invoice_unpaid","invoice_overdue"]` — both status values narrow the SAME count together, in one request.

Sample response (`200`, trimmed to the `"ALL"` row):

```json
{
  "status": "ok",
  "data": {
    "total": {
      "date": { "first_date": "2025-07-09 19:00:14", "last_date": "2026-10-01 09:48:13" },
      "result": {
        "ALL": [{ "total_amount": 643.2, "count": 59 }]
      }
    }
  },
  "related": null,
  "total": null,
  "error": null,
  "messages": [],
  "meta": null
}
```

Fixture: `__tests__/fixtures/get-stats-25beace4.json`

**Active tickets**

```bash
curl "$API/stats?type=tickets&report=%5B%22open%22%5D&date_to=2026-10-03" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: application/json"
```

No `currency_code` — this report has no currency dimension, and the parameter is not sent for it. `report` decodes to `["open"]`.

Sample response (`200`):

```json
{
  "status": "ok",
  "data": {
    "open": {
      "date": { "first_date": "2026-09-14 20:47:54", "last_date": "2026-10-02 16:46:41" },
      "result": [{ "count": 309 }]
    }
  },
  "related": null,
  "total": null,
  "error": null,
  "messages": [],
  "meta": null
}
```

Fixture: `__tests__/fixtures/get-stats-date-to-2026-10-03-report-open-type-tickets.json`

### GET /clients/upmind_usage

Role: for an Upmind-context account, returns that account's partner-usage figures. For an ordinary client account, refuses.

```bash
curl "$API/clients/upmind_usage" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Accept: application/json"
```

Sample response (`409` — the only response this documentation set has observed, from every account it was able to query):

```json
{
  "status": "error",
  "data": null,
  "related": null,
  "total": null,
  "error": {
    "id": "4244c94077e4dd7ea197cd3ee1eeb3ccd341807a",
    "type": 0,
    "code": 409,
    "message": "This client is not an Upmind client!",
    "data": []
  },
  "messages": null,
  "meta": null
}
```

Fixture: `__tests__/fixtures/get-clients-upmind-usage.json`

**No success response is documented.** Every account available while producing this documentation is an ordinary client account, and every one of them answered `409`. An Upmind-context account's response shape is unknown here; a caller planning against a success response has no captured contract to build from.

## Failure modes

### `GET /stats` — a report window can hold nothing, two different ways

A currency-bound tile's report can come back `null` at the report-key level (no report at all for the window), or come back present but with no `"ALL"` key in its result map. Both mean the same thing operationally — nothing to count for this window — but the platform represents them with two different shapes on the wire. A consumer normalising the response has to treat both as the same absent outcome, and must not read either as a zero: a genuine zero count is `{ "ALL": [{ "count": 0 }] }`, a real, present value.

### `GET /stats` — array-style query parameters answer with a server error, not a validation error

Sending `report` or `invoice_status` as a repeated query key (the conventional array-serialisation form) rather than as a single JSON-array-shaped string value answers with a server error rather than a normal validation response. This is a request-shape contract, not a soft failure of the read itself, but it is easy to trigger by accident with a generic query-serialisation helper.

### `GET /clients/upmind_usage` — the only observed outcome is a hard refusal

Every observed call answers `409` with a fixed message identifying the account as not an Upmind-context account. There is no soft-failure path documented, because no success path has been observed at all.

### No addressable client → no request at all

Both endpoints resolve the target client from the active session before any request is issued. With no authenticated session and a resolved client identity, no request is issued for either endpoint — there is no HTTP exchange to observe.

## Lessons (hard-won)

- **A report window with nothing to show and a report window that was never requested look identical from the outside, but the wire tells them apart two different ways.** One report type returns `null` at the report-key level for an empty window; another returns the report present but with no matching currency key. A consumer that only checks "is the report present" will misread the second case as data, when it is actually empty.
- **Requesting fewer report keys narrows what comes back, not just what is read.** Naming a single report key (e.g. one ticket status) on a request returns a response carrying only that key — the platform does not send back an envelope of every possible report key regardless of what was asked for. A consumer that assumes the full key set is always present will read an absent key as a missing feature rather than a request-shape consequence.
- **A currency-bound report and a non-currency-bound report are not variations of the same contract — one of the four tiles has no currency dimension at all**, and sending a currency parameter on it is simply not part of that report's contract, not an optional extra.
- **Array-shaped query parameters have to be sent as a JSON-array string, not as a repeated key** — the conventional repeated-key array serialisation a generic HTTP client defaults to causes a server error on this endpoint family, not a normal empty-result response.
- **A configuration-gated element's visibility has two independent failure directions, and they are not symmetric.** The gate itself can be explicitly turned off, or the read of the gate can fail — and a consumer has to decide, for each such gate, whether a broken read should hide the element (fail closed) or leave it showing (fail open); the two choices produce opposite user-facing behaviour from the identical failure.
- **A currency-summed "ALL" count is a distinct key on the same result map as any specific currency's own count** — it is not derived client-side by summing the per-currency rows, and a consumer that tries to derive it that way risks disagreeing with the platform's own arithmetic (currency conversion, rounding).
- **An endpoint that exists to distinguish two account classes may only ever be observable in its refusal state**, when no account of the other class is available to query. Documenting only the refusal path, and stating plainly that the success path is unobserved, is more honest than inferring a success shape from an unrelated source.
