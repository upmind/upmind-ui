# tests/fixtures/imports

The staging import factory. A module recorder that needs state only an import
can make (for example a set of invoices with chosen numbers, dates and statuses)
states that data, and the factory loads it onto staging the way the legacy admin
import screen does. It is arrangement: the `Generator` never captures it
([ADR 035](../../../docs/adr/035-one-scenario-one-recording.md)).

| File | Role |
| --- | --- |
| `import-factory.ts` | `buildImportSet`, `importToStaging`, `restoreImport` |
| `import-factory.types.ts` | `ImportStatement`, `ImportSet`, `ImportHandle`, `StagingConfig`, `TemplateType`, `RecordSpec` |
| `templates/<type>.csv` | the upstream header of each record type, plus one synthetic row |
| `templates.generated.ts` | reads the header line of each template CSV |
| `import-factory.files.test.ts` | the writer, no network |
| `import-factory.drift.test.ts` | each committed header against upstream |
| `import-factory.staging.test.ts` | the staging client, needs staging credentials |

## How a recorder uses it

1. State the data as an `ImportStatement`: one array per record type
   (`clients`, `users`, `products`, `contracts`, `invoices`,
   `clientPaymentDetails`). Each entry is a `RecordSpec`: an optional `id` plus
   any columns of that type's template.
2. `buildImportSet(statement)` is pure. It returns one CSV per record type, in
   memory, with no network call.
3. `importToStaging(set, config)` imports the set and returns an `ImportHandle`.
4. `restoreImport(handle, config)` removes a staged import.

```ts
import {
  buildImportSet,
  importToStaging,
  restoreImport
} from "../../../../../../tests/fixtures/imports/import-factory";

const set = buildImportSet({
  brandId, // required by importToStaging
  staged: true, // stop before commit; see "Staged and committed"
  clients: [{ id: "c1" }],
  invoices: [
    { id: "inv1", client_id: "c1", number: "X-1", status: "invoice_unpaid" }
  ]
});
const handle = await importToStaging(set, { apiUrl, origin, token });
// ... record the steps ...
await restoreImport(handle, { apiUrl, origin, token });
```

`StagingConfig` is `{ apiUrl, origin, token }`: the API base URL, the brand
origin sent as the `Origin` header, and a staff bearer token. The recorder takes
them from its recording environment (`VITE_API_URL`, `RECORDING_BRAND_ORIGIN`)
and the staff account in [`../credentials.ts`](../credentials.ts). Never log or
print the credentials or the token.

### Statement rules

- **Local ids.** `id` is a local label used to link rows inside the set. Without
  one a record gets `<type>-<n>`. The `id` column is always written as the local
  id.
- **Linking.** A reference column (`client_id`, `user_id`, `contract_id`,
  `contract_product_product_id`, `invoice_product_product_id`,
  and `client_id` on payment details) that the spec does not set is filled with
  the local id of the FIRST record of the target type in the set, or left empty
  when the set has none. Set the column explicitly to link to any other record.
- **Synthetic values.** Every other column the spec omits gets a deterministic,
  PII-free value (`example.com` emails, `TestFirst...` names, `GBP`, `GB`,
  `2030-01-01 00:00:00` dates, `0.00` amounts). An explicit spec value wins.
- **Unknown fields.** A key that is not a column of the type's template makes
  `buildImportSet` throw, naming the field and the template.
- **Run stamp.** The import name is `<name>-<timestamp>` (`name` defaults to
  `import-factory`), so two runs never collide.
- **All six files.** The set always holds six files in upload order (products,
  users, clients, client-payment-details, contracts, invoices). A type the
  statement does not name is a header-only file, because an empty step
  auto-skips and blocks the import.

## What `importToStaging` does

It copies the legacy import sequence with one uncaptured staff call:

1. `POST api/admin/brands/select { brand_id }`. The staff session is in
   organisation mode and the upload route reads the brand from the session, not
   from the multipart `brand_id`. Without this the upload answers 422
   "Brand id required in organisation mode!". `set.brandId` is therefore
   required.
2. `POST api/admin/imports { name, source_code: "csv_data" }`.
3. For each file: `POST api/admin/import/files` (multipart `file` and
   `brand_id`), then `PUT api/admin/import/dynamic_files/import_step/{stepId}`
   with `{ file_ids }`. `import` is singular in the attach route.
4. For each step in order: `PATCH .../steps/{stepId}/start`, polling every
   2.5 s, up to 40 polls, until the step is staged, skipped or complete.
5. `PATCH api/admin/imports/{id}/commit`, unless the statement is `staged`.

A failure cancels and removes the import (best effort) and rethrows. When a step
errors, the thrown message carries the per-row errors the server recorded, read
from `GET api/admin/imports/{id}/logs`. That is where a rejected row is named:
read it first when a step fails.

### Staff grant

The staff token comes from `POST oauth/access_token` with `grant_type: "admin"`
(`GrantTypes.ADMIN`) and the staff username and password; the client account
uses the password grant. Calls carry `Run-As: user`. The login is shown in
`import-factory.staging.test.ts`, which skips with a named cause when
credentials are absent.

### Mapping resolution

A step that reaches `import_mappings_required` is resolved, not skipped:
`mappings/skip` answers 409 while a required mapping has no object. For each
mapping that is `required` and has no `object_id` the factory:

1. lists the step's mappings (`?with=object&limit=0&with_staged_imports=1`);
2. picks an object. A `status` mapping lists statuses filtered to the mapping's
   object type (default `contract`) and prefers the status whose code is
   `<type>_<row value>`, then a code containing the row value, then
   `<type>_active`, then `<type>_unpaid`, then the first. `product`, `client`,
   `user` and `currency` mappings list their admin route and match by name, else
   take the first;
3. sends `PUT .../mappings/{mappingId} { object_id }` (PATCH answers 405);
4. then `PATCH .../mappings/skip`.

A required mapping with no candidate object throws, naming the mapping. Contract
`status` is left empty on purpose so the contracts step resolves it this way.

### Attach field requirements

Staging refuses an attach when some columns are empty. The writer fills these
when the spec omits them (an explicit value wins):

| Type | Column | Default |
| --- | --- | --- |
| products | `product_billing_type` | `subscription` |
| products | `price_billing_cycle_months` | `1` |
| clients | `address_address_1`, `address_city`, `address_postcode` | `1 Test Street`, `Testville`, `TE5 7XX` |
| contracts | `contract_product_billing_cycle_months` | `1` |
| invoices | `number` | `INV-<localId>` |
| invoices | `status` | `paid` |
| invoices | `due_date` | `2030-01-01` |
| invoices | `invoice_product_id` | `invline-<localId>-<seed>` |

A bare invoice (`{ id }` with no linked client or product) is still rejected by
the invoices step with a 422; the staging test asserts that rejection. The
factory then cancels and removes the failed import.

## Staged and committed

- **Staged** (`staged: true`) stops at `import_staged`, before commit. A staged
  import is restorable: `restoreImport` cancels it, then deletes it, and a read
  of the import answers 404.
- **Committed** (`staged` unset or false) creates real records, and they are
  permanent. Staging refuses to undo a committed import (409, operator ruling
  2026-10-02; no test here asserts that answer). `restoreImport` on a committed
  handle tries cancel and delete up to eight times, then throws
  "could not restore import ... cancel it by hand". Do not pair a committed
  import with `restoreImport`.
- **Import once, find-or-create, keep it.** A recorder that needs committed data
  imports it once under a stable marker (for example a number prefix), finds it
  on every later run, and imports only when it is absent. The legacy-invoices
  recorder
  ([`legacy-invoices.import-fixture.ts`](../../../packages/headless/src/modules/legacy-invoices/__tests__/legacy-invoices.import-fixture.ts))
  is the worked example.

`restoreImport` selects the brand again first, and nudges an import wedged at
`import_step_ready` into a cancellable state before cancelling.

## Templates

`templates/*.csv` are the headers of
[github.com/upmind-automation/csv-import-examples](https://github.com/upmind-automation/csv-import-examples)
(clients, users, products, contracts, invoices, client-payment-details), each
with one synthetic row. Only the headers are used; no real export rows are
copied. `import-factory.drift.test.ts` compares each committed header with the
upstream `main` file and names the template that drifted. When upstream is
unreachable each case skips with its named cause; it never passes silently.

## What a template cannot carry

- **A column the template lacks.** The writer throws
  `Field "<field>" is not a column of the "<type>" template.` A state that needs
  such a field cannot be arranged by an import.
- **A flag no route sets.** Nothing marks a committed record as "imported" or
  "staged". An import is either staged (not yet real) or committed.
- **A separate contract-products file.** The six templates are the only types;
  contract product data rides in the contracts template's
  `contract_product_*` columns, and invoice line data in the invoices template's
  `invoice_product_*` columns, one set per row.

## Running the checks

```sh
pnpm exec vitest run tests/fixtures/imports
```

The writer and drift tests run without credentials. The staging test runs only
with staging credentials and skips with its cause otherwise.
