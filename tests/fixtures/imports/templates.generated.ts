// -----------------------------------------------------------------------------
/**
 * @module tests/fixtures/imports/templates.generated
 * @description The header line of each committed `templates/<type>.csv`, read
 * from the file itself so the templates stay the one source of each header.
 * `import-factory.drift.test.ts` proves each template matches the upstream
 * csv-import-examples header (AC9).
 */

import { readFileSync } from "node:fs";

// -----------------------------------------------------------------------------

function header(name: string): string {
  const body = readFileSync(
    new URL(`./templates/${name}.csv`, import.meta.url),
    "utf8"
  );
  return body.split(/\r?\n/, 1)[0] ?? "";
}

export const CLIENTS_HEADER = header("clients");
export const USERS_HEADER = header("users");
export const PRODUCTS_HEADER = header("products");
export const CONTRACTS_HEADER = header("contracts");
export const INVOICES_HEADER = header("invoices");
export const CLIENT_PAYMENT_DETAILS_HEADER = header("client-payment-details");
