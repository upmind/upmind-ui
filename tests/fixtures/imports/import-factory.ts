// -----------------------------------------------------------------------------
/**
 * @module tests/fixtures/imports/import-factory
 * @description The staging import factory. `buildImportSet` is a pure writer:
 * it turns a statement into linked, synthetic CSV files in memory, with no
 * network. `importToStaging` and `restoreImport` copy the legacy admin import
 * sequence (design §8.2, proven by receipts s4–s7) using one uncaptured staff
 * call, like `arrangeCall` (ADR-3). The brand MUST be selected on the staff
 * session before any upload — the upload route resolves the brand from the
 * session, not the multipart body (receipt s6).
 *
 * A step that reaches `import_mappings_required` is RESOLVED, not skipped: the
 * contracts step raises a required `status` mapping (filtered to the contract
 * object type) that `mappings/skip` refuses with 409 until an object is set.
 * `driveStep` applies each required mapping the legacy way — list with
 * `with=object`, resolve a candidate object, `PUT …/mappings/{id}` with the
 * `object_id` (not PATCH — the route answers 405), then `mappings/skip` — then
 * continues. Mirrors vue-app stepMappingsProvider.vue + mappings.ts.
 */

import {
  CLIENT_PAYMENT_DETAILS_HEADER,
  CLIENTS_HEADER,
  CONTRACTS_HEADER,
  INVOICES_HEADER,
  PRODUCTS_HEADER,
  USERS_HEADER
} from "./templates.generated";
import type {
  ImportFile,
  ImportHandle,
  ImportSet,
  ImportStatement,
  RecordSpec,
  StagingConfig,
  TemplateType
} from "./import-factory.types";

// -----------------------------------------------------------------------------

const TEMPLATE_HEADERS: Record<TemplateType, string> = {
  clients: CLIENTS_HEADER,
  users: USERS_HEADER,
  products: PRODUCTS_HEADER,
  contracts: CONTRACTS_HEADER,
  invoices: INVOICES_HEADER,
  "client-payment-details": CLIENT_PAYMENT_DETAILS_HEADER
};

/** The import-step code each template attaches to (design §8.2, receipt s7). */
const STEP_CODE: Record<TemplateType, string> = {
  products: "products",
  users: "users",
  clients: "clients",
  "client-payment-details": "client_payment_details",
  contracts: "contracts",
  invoices: "invoices"
};

/** Upload order mirrors the server step order (products first, invoices last). */
const UPLOAD_ORDER: TemplateType[] = [
  "products",
  "users",
  "clients",
  "client-payment-details",
  "contracts",
  "invoices"
];

/** Statement key → template type. */
const STATEMENT_KEY: Record<
  Exclude<keyof ImportStatement, "name" | "staged" | "brandId">,
  TemplateType
> = {
  clients: "clients",
  users: "users",
  products: "products",
  contracts: "contracts",
  invoices: "invoices",
  clientPaymentDetails: "client-payment-details"
};

/** Reference columns auto-wired to a local id of another record in the set. */
const REFERENCES: Record<
  TemplateType,
  { column: string; target: TemplateType }[]
> = {
  clients: [],
  users: [],
  products: [],
  "client-payment-details": [{ column: "client_id", target: "clients" }],
  contracts: [
    { column: "client_id", target: "clients" },
    { column: "contract_product_product_id", target: "products" }
  ],
  invoices: [
    { column: "client_id", target: "clients" },
    { column: "user_id", target: "users" },
    { column: "contract_id", target: "contracts" },
    { column: "invoice_product_product_id", target: "products" }
  ]
};

/**
 * Required attach fields staging demands that a statement should not have to
 * supply. Proven live (all six steps attach 200 and reach import_staged): a bare
 * statement omitting these now stages. An explicit spec value always wins.
 * Contract `status` is left empty on purpose — the contracts step resolves it to
 * a real contract status via the required mapping (see resolveMappingObjectId).
 */
const SYNTHETIC_DEFAULTS: Record<
  TemplateType,
  Record<string, (localId: string, seed: string) => string>
> = {
  products: {
    product_billing_type: () => "subscription",
    price_billing_cycle_months: () => "1"
  },
  users: {},
  clients: {
    address_address_1: () => "1 Test Street",
    address_city: () => "Testville",
    address_postcode: () => "TE5 7XX"
  },
  "client-payment-details": {},
  contracts: { contract_product_billing_cycle_months: () => "1" },
  invoices: {
    number: localId => `INV-${localId}`,
    status: () => "paid",
    due_date: () => "2030-01-01",
    invoice_product_id: (localId, seed) => `invline-${localId}-${seed}`
  }
};

// -----------------------------------------------------------------------------

/** The columns a template carries, parsed from its header line. */
function columnsOf(type: TemplateType): string[] {
  return parseHeader(TEMPLATE_HEADERS[type]);
}

/** Split a header line into bare column names (quotes stripped). */
function parseHeader(header: string): string[] {
  return header.split(",").map(c => c.replace(/^"|"$/g, ""));
}

/** A deterministic synthetic value for a column, PII-free (design §8.4). */
function syntheticValue(column: string, localId: string, seed: string): string {
  if (column === "id") return localId;
  if (/email/.test(column)) return `test-${localId}-${seed}@example.com`;
  if (/(^|_)(first_?name|firstname)$/.test(column))
    return `TestFirst${localId}`;
  if (/(^|_)(last_?name|lastname)$/.test(column)) return `TestLast${localId}`;
  if (/username/.test(column)) return `test-${localId}-${seed}`;
  if (/name$/.test(column)) return `Test ${localId}`;
  if (/description/.test(column)) return `Synthetic ${localId}`;
  if (/token/.test(column)) return `test_token_${localId}`;
  if (/currency_code/.test(column)) return "GBP";
  if (/country_code/.test(column)) return "GB";
  if (/billing_cycle_months$/.test(column)) return "1";
  if (/amount|price/.test(column)) return "0.00";
  if (/quantity/.test(column)) return "1";
  if (
    /(^|_)(admin|active|verified|is_default|allow_auto_payment|has_login|renew)$/.test(
      column
    )
  )
    return "0";
  if (/date|_at$/.test(column)) return "2030-01-01 00:00:00";
  return "";
}

/** CSV-escape one value (quote when it holds a comma, quote or newline). */
function escapeCsv(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Assign a local id to each spec (preserving an explicit one). */
function withLocalIds(
  specs: RecordSpec[],
  type: TemplateType
): { localId: string; spec: RecordSpec }[] {
  return specs.map((spec, i) => ({
    localId:
      typeof spec.id === "string" && spec.id.length
        ? spec.id
        : `${type}-${i + 1}`,
    spec
  }));
}

// -----------------------------------------------------------------------------

/**
 * Build the linked, synthetic CSV file set for one statement. Pure — no network.
 * Refuses a stated field that no template carries, naming the field and the
 * template (AC8).
 *
 * @throws when a record spec carries a key that is not a column of its template.
 */
export function buildImportSet(statement: ImportStatement): ImportSet {
  const seed = Date.now().toString(36);
  const stamp = `${Date.now()}`;
  const name = `${statement.name ?? "import-factory"}-${stamp}`;

  // Collect specs per type and assign local ids, so references can resolve.
  const byType = {} as Record<
    TemplateType,
    { localId: string; spec: RecordSpec }[]
  >;
  for (const [key, type] of Object.entries(STATEMENT_KEY) as [
    keyof ImportStatement,
    TemplateType
  ][]) {
    const specs = (statement[key] as RecordSpec[] | undefined) ?? [];
    byType[type] = withLocalIds(specs, type);
  }

  const files: ImportFile[] = [];

  for (const type of UPLOAD_ORDER) {
    const header = TEMPLATE_HEADERS[type];
    const columns = parseHeader(header);
    const columnSet = new Set(columns);
    const records = byType[type] ?? [];

    const rows = records.map(({ localId, spec }) => {
      // Field check (AC8): every key but `id` must be a template column.
      for (const field of Object.keys(spec)) {
        if (field === "id") continue;
        if (!columnSet.has(field)) {
          throw new Error(
            `Field "${field}" is not a column of the "${type}" template.`
          );
        }
      }

      const values: Record<string, string> = {};
      for (const column of columns) {
        if (column === "id") {
          values[column] = localId;
          continue;
        }
        if (spec[column] !== undefined) {
          values[column] = String(spec[column]);
          continue;
        }
        const ref = REFERENCES[type].find(r => r.column === column);
        if (ref) {
          const target = byType[ref.target]?.[0];
          values[column] = target ? target.localId : "";
          continue;
        }
        const fallback = SYNTHETIC_DEFAULTS[type]?.[column];
        if (fallback) {
          values[column] = fallback(localId, seed);
          continue;
        }
        values[column] = syntheticValue(column, localId, seed);
      }
      return { localId, values };
    });

    const body = [
      header,
      ...rows.map(r => columns.map(c => escapeCsv(r.values[c] ?? "")).join(","))
    ].join("\n");

    files.push({
      type,
      stepCode: STEP_CODE[type],
      header,
      rows,
      csv: `${body}\n`,
      localIds: rows.map(r => r.localId)
    });
  }

  return {
    name,
    staged: statement.staged ?? false,
    brandId: statement.brandId,
    files
  };
}

// -----------------------------------------------------------------------------
// Staging client — the legacy import sequence, one uncaptured staff call.
// -----------------------------------------------------------------------------

const CANCELLABLE = new Set([
  "import_exporting",
  "import_in_progress",
  "import_mappings_required",
  "import_staged"
]);
const STEP_DONE = new Set([
  "import_staged",
  "import_step_skipped",
  "import_complete"
]);
const STEP_ERROR = new Set([
  "import_error",
  "import_step_error",
  "import_failed"
]);

/** Legacy mapping list params (mappings.ts list): with=object, all rows, staged. */
const MAPPINGS_PARAMS = "?with=object&limit=0&with_staged_imports=1";

/** Candidate-object list routes per mapping object_type (vue-app mappingSources/*). */
const OBJECT_ROUTES: Record<string, string> = {
  product:
    "/api/admin/products?with=category,image,prices&limit=50&with_staged_imports=1",
  client: "/api/admin/clients?limit=50&with_staged_imports=1",
  user: "/api/admin/users?limit=50&with_staged_imports=1",
  currency: "/api/admin/currencies?limit=200"
};

const sleep = (ms: number): Promise<void> =>
  new Promise(r => setTimeout(r, ms));

function headers(
  config: StagingConfig,
  extra: Record<string, string> = {}
): Record<string, string> {
  return {
    Accept: "application/json",
    Origin: config.origin,
    Authorization: `Bearer ${config.token}`,
    "Run-As": "user",
    ...extra
  };
}

async function call(
  config: StagingConfig,
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; body: any }> {
  const res = await fetch(`${config.apiUrl}${path}`, {
    method,
    headers: headers(config, { "Content-Type": "application/json" }),
    body: body == null ? undefined : JSON.stringify(body)
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

async function uploadFile(
  config: StagingConfig,
  brandId: string,
  file: ImportFile
): Promise<string> {
  const form = new FormData();
  form.append(
    "file",
    new Blob([file.csv], { type: "text/csv" }),
    `${file.stepCode}.csv`
  );
  form.append("brand_id", brandId);
  const res = await fetch(`${config.apiUrl}/api/admin/import/files`, {
    method: "POST",
    headers: headers(config),
    body: form
  });
  const json = await res.json().catch(() => null);
  const id = json?.data?.[0]?.id;
  if (res.status !== 200 || !id) {
    throw new Error(
      `[import-factory] upload of ${file.stepCode} failed (${res.status}): ` +
        JSON.stringify(json?.error?.message ?? json)
    );
  }
  return id;
}

async function readImport(
  config: StagingConfig,
  importId: string
): Promise<any> {
  const res = await call(
    config,
    "GET",
    `/api/admin/imports/${importId}?with=steps,steps.status,status`
  );
  return res.body?.data;
}

/** The per-row integration errors the server records for an import (logs.ts). */
async function readImportLogs(
  config: StagingConfig,
  importId: string
): Promise<string> {
  const res = await call(
    config,
    "GET",
    `/api/admin/imports/${importId}/logs?with=object&limit=50`
  );
  const rows: any[] = res.body?.data ?? [];
  const messages = rows
    .map(l => l.message ?? l.text ?? l.description)
    .filter(Boolean);
  return messages.join("; ");
}

/**
 * Resolve the Upmind object a required mapping should point at. A `status`
 * mapping lists statuses filtered to the mapping's object type and prefers the
 * status whose code matches the row's value, else the type's `active`/`unpaid`
 * default; other object types list their admin route and match by name.
 */
async function resolveMappingObjectId(
  config: StagingConfig,
  mapping: any
): Promise<string | undefined> {
  const type = mapping.object_type;

  if (type === "status") {
    const filterType = mapping.filters?.object_type ?? "contract";
    const res = await call(
      config,
      "GET",
      `/api/admin/statuses?filter[object_type]=${encodeURIComponent(
        filterType
      )}&limit=100`
    );
    const rows: any[] = res.body?.data ?? [];
    const wanted = String(mapping.external_id ?? "")
      .replace(new RegExp(`-${filterType}$`), "")
      .toLowerCase();
    const byCode = (code: string): any =>
      rows.find(r => (r.code ?? "").toLowerCase() === code);
    const pick =
      (wanted && byCode(`${filterType}_${wanted}`)) ||
      (wanted &&
        rows.find(r => (r.code ?? "").toLowerCase().includes(wanted))) ||
      byCode(`${filterType}_active`) ||
      byCode(`${filterType}_unpaid`) ||
      rows[0];
    return pick?.id;
  }

  const route = OBJECT_ROUTES[type];
  if (!route) return undefined;
  const res = await call(config, "GET", route);
  const rows: any[] = res.body?.data ?? [];
  const match = rows.find(
    r =>
      (r.name ?? "").toLowerCase() ===
      String(mapping.external_name ?? "").toLowerCase()
  );
  return (match ?? rows[0])?.id;
}

/**
 * Apply every required-and-unmapped mapping of a step (mappings.ts update is
 * PUT, not PATCH), so `mappings/skip` stops answering 409.
 */
async function applyMappings(
  config: StagingConfig,
  importId: string,
  stepId: string
): Promise<void> {
  const list = await call(
    config,
    "GET",
    `/api/admin/imports/${importId}/steps/${stepId}/mappings${MAPPINGS_PARAMS}`
  );
  const mappings: any[] = list.body?.data ?? [];
  for (const mapping of mappings) {
    if (!mapping.required || mapping.object_id) continue;
    const objectId = await resolveMappingObjectId(config, mapping);
    if (!objectId) {
      throw new Error(
        `[import-factory] no object to map required ${mapping.object_type} ` +
          `mapping "${mapping.external_name}" (step ${stepId})`
      );
    }
    const upd = await call(
      config,
      "PUT",
      `/api/admin/imports/${importId}/steps/${stepId}/mappings/${mapping.id}`,
      { object_id: objectId }
    );
    if (upd.status !== 200) {
      throw new Error(
        `[import-factory] mapping update ${mapping.id} failed (${upd.status}): ` +
          JSON.stringify(upd.body?.error?.message ?? upd.body)
      );
    }
  }
}

/** Drive one step from pending → done (staged/skipped/complete). */
async function driveStep(
  config: StagingConfig,
  importId: string,
  stepId: string
): Promise<void> {
  for (let i = 0; i < 40; i++) {
    const data = await readImport(config, importId);
    if (data?.status?.code === "import_staged") return;
    const step = (data?.steps ?? []).find((s: any) => s.id === stepId);
    const code = step?.status?.code;
    if (STEP_DONE.has(code)) return;
    if (STEP_ERROR.has(code) || STEP_ERROR.has(data?.status?.code)) {
      const logs = await readImportLogs(config, importId);
      throw new Error(
        `[import-factory] step ${stepId} errored (${
          code ?? data?.status?.code
        })` + (logs ? `: ${logs}` : "")
      );
    }
    if (code === "import_step_ready" || code === "import_pending") {
      await call(
        config,
        "PATCH",
        `/api/admin/imports/${importId}/steps/${stepId}/start`
      );
    } else if (code === "import_mappings_required") {
      await applyMappings(config, importId, stepId);
      await call(
        config,
        "PATCH",
        `/api/admin/imports/${importId}/steps/${stepId}/mappings/skip`
      );
    }
    await sleep(2500);
  }
  const logs = await readImportLogs(config, importId);
  throw new Error(
    `[import-factory] step ${stepId} did not reach a done state` +
      (logs ? ` — logs: ${logs}` : "")
  );
}

/**
 * Import a set to staging the legacy way: select the brand on the session,
 * create, upload+attach every step, drive each step in order, then commit
 * (unless the set is staged). Cancels and removes the import on any failure.
 */
export async function importToStaging(
  set: ImportSet,
  config: StagingConfig
): Promise<ImportHandle> {
  const brandId = set.brandId;
  if (!brandId) {
    throw new Error("[import-factory] importToStaging needs set.brandId");
  }

  // Bind the brand to the staff session — the upload route reads the brand from
  // the session, not the multipart body (receipt s6). Without this the upload
  // answers 422 "Brand id required in organisation mode!".
  const select = await call(config, "POST", "/api/admin/brands/select", {
    brand_id: brandId
  });
  if (select.status !== 200) {
    throw new Error(`[import-factory] brands/select failed (${select.status})`);
  }

  const create = await call(config, "POST", "/api/admin/imports", {
    name: set.name,
    source_code: "csv_data"
  });
  const imp = create.body?.data;
  const importId = imp?.id;
  if (create.status !== 200 || !importId) {
    throw new Error(`[import-factory] create failed (${create.status})`);
  }

  const handle: ImportHandle = {
    importId,
    name: set.name,
    brandId,
    staged: set.staged,
    localIds: set.files.map(f => ({ type: f.type, ids: f.localIds }))
  };

  try {
    const steps: any[] = [...(imp.steps ?? [])].sort(
      (a, b) => a.order - b.order
    );
    const stepIdByCode: Record<string, string> = {};
    for (const s of steps) stepIdByCode[s.code] = s.id;

    // Every step needs a file, or an empty step auto-skips and blocks the
    // import (receipt s7) — the set always carries all six (header-only when
    // the statement names no records of that type).
    for (const file of set.files) {
      const fileId = await uploadFile(config, brandId, file);
      const stepId = stepIdByCode[file.stepCode];
      const attach = await call(
        config,
        "PUT",
        `/api/admin/import/dynamic_files/import_step/${stepId}`,
        { file_ids: [fileId] }
      );
      if (attach.status !== 200) {
        throw new Error(
          `[import-factory] attach of ${file.stepCode} failed (${attach.status}): ` +
            JSON.stringify(attach.body?.error?.message ?? attach.body)
        );
      }
    }

    for (const step of steps) {
      await driveStep(config, importId, step.id);
      if (
        (await readImport(config, importId))?.status?.code === "import_staged"
      )
        break;
    }

    if (!set.staged) {
      const staged = await readImport(config, importId);
      if (staged?.status?.code !== "import_staged") {
        throw new Error(
          `[import-factory] import not staged before commit (${staged?.status?.code})`
        );
      }
      const commit = await call(
        config,
        "PATCH",
        `/api/admin/imports/${importId}/commit`
      );
      if (commit.status !== 200) {
        throw new Error(`[import-factory] commit failed (${commit.status})`);
      }
    }

    return handle;
  } catch (error) {
    await restoreImport(handle, config).catch(() => undefined);
    throw error;
  }
}

/**
 * Remove an import and every record it created: cancel, then delete. A wedged
 * `import_step_ready` is first nudged into a cancellable state (receipt s7).
 */
export async function restoreImport(
  handle: ImportHandle,
  config: StagingConfig
): Promise<void> {
  const { importId, brandId } = handle;
  await call(config, "POST", "/api/admin/brands/select", { brand_id: brandId });

  for (let attempt = 0; attempt < 8; attempt++) {
    const data = await readImport(config, importId);
    if (!data) return;
    const status = data.status?.code;

    if (
      CANCELLABLE.has(status) ||
      status === "import_pending" ||
      status === "import_cancelled" ||
      status === "import_complete"
    ) {
      await call(config, "PATCH", `/api/admin/imports/${importId}/cancel`);
      await sleep(1200);
      const del = await call(
        config,
        "DELETE",
        `/api/admin/imports/${importId}`
      );
      if (del.status === 200) return;
    }

    const ready = [...(data.steps ?? [])]
      .sort((a: any, b: any) => a.order - b.order)
      .find((s: any) => s.status?.code === "import_step_ready");
    if (ready) {
      const form = new FormData();
      form.append(
        "file",
        new Blob([`${TEMPLATE_HEADERS.products}\n`], { type: "text/csv" }),
        "x.csv"
      );
      form.append("brand_id", brandId);
      await fetch(`${config.apiUrl}/api/admin/import/files`, {
        method: "POST",
        headers: headers(config),
        body: form
      })
        .then(r => r.json())
        .catch(() => null)
        .then(j => j?.data?.[0]?.id)
        .then(
          id =>
            id &&
            call(
              config,
              "PUT",
              `/api/admin/import/dynamic_files/import_step/${ready.id}`,
              { file_ids: [id] }
            )
        );
      await call(
        config,
        "PATCH",
        `/api/admin/imports/${importId}/steps/${ready.id}/start`
      );
      await sleep(1500);
      await call(config, "PATCH", `/api/admin/imports/${importId}/cancel`);
      await sleep(1200);
      const del = await call(
        config,
        "DELETE",
        `/api/admin/imports/${importId}`
      );
      if (del.status === 200) return;
    }
    await sleep(2000);
  }
  throw new Error(
    `[import-factory] could not restore import ${importId} — cancel it by hand`
  );
}
