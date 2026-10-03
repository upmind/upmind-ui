/**
 * @fileoverview import-factory file writer tests (AC1, AC2, AC4, AC8)
 *
 * ## Job To Be Done
 * Prove `buildImportSet` — the pure writer — turns a statement into linked,
 * synthetic CSV files with no network: one file per stated record type carrying
 * its template header (AC1); every reference resolving to a local id in the set
 * (AC2); only synthetic values, no real name/email/token and no row copied from
 * the real export (AC4); and a field no template carries refused by name (AC8).
 *
 * ## What Breaks If These Fail
 * A recorder arranges the wrong staging data, leaks real PII into a committed
 * fixture, builds dangling references staging rejects, or silently drops a field
 * the prover believed was imported — calling a state "blocked" when only the
 * data was missing.
 *
 * Assertions are derived from docs/sdd/import-factory/bdd.md and design §8.3–8.5,
 * never from the writer's implementation.
 */

import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildImportSet } from "./import-factory";
import type { ImportSet, TemplateType } from "./import-factory.types";

const REAL_EXPORT_DIR = "/Users/domdacosta/Dev/Upmind/imports";

function committedHeader(type: TemplateType): string {
  const path = fileURLToPath(
    new URL(`./templates/${type}.csv`, import.meta.url)
  );
  return readFileSync(path, "utf8").split("\n")[0].replace(/\r$/, "");
}

function fileOf(set: ImportSet, type: TemplateType) {
  return set.files.find(f => f.type === type);
}

function allCellValues(set: ImportSet): string[] {
  return set.files.flatMap(f => f.rows.flatMap(r => Object.values(r.values)));
}

function realExportRowHashes(): Set<string> {
  const hashes = new Set<string>();
  for (const name of readdirSync(REAL_EXPORT_DIR)) {
    if (!name.endsWith(".csv")) continue;
    const lines = readFileSync(`${REAL_EXPORT_DIR}/${name}`, "utf8").split(
      "\n"
    );
    for (const line of lines.slice(1)) {
      const trimmed = line.replace(/\r$/, "").trim();
      if (trimmed)
        hashes.add(createHash("sha256").update(trimmed).digest("hex"));
    }
  }
  return hashes;
}

describe("buildImportSet file writer", () => {
  it("writes one file per stated type with the template header and the stated row count (AC1)", () => {
    const set = buildImportSet({
      clients: [{ id: "c1" }],
      products: Array.from({ length: 7 }, (_, i) => ({ id: `p${i + 1}` })),
      invoices: Array.from({ length: 5 }, (_, i) => ({
        id: `inv${i + 1}`,
        client_id: "c1"
      }))
    });

    const stated = [
      ["clients", 1],
      ["products", 7],
      ["invoices", 5]
    ] as const;

    for (const [type, count] of stated) {
      const file = fileOf(set, type);
      expect(file, `no file for ${type}`).toBeDefined();
      expect(file!.csv.split("\n")[0]).toBe(committedHeader(type));
      expect(file!.rows).toHaveLength(count);
    }

    const statedTypes = new Set(stated.map(([type]) => type as TemplateType));
    const implied = set.files.filter(
      f => !statedTypes.has(f.type) && f.rows.length > 0
    );
    for (const parent of implied) {
      const linked = set.files.some(
        other =>
          other.type !== parent.type &&
          other.rows.some(row =>
            parent.localIds.some(id => Object.values(row.values).includes(id))
          )
      );
      expect(linked, `implied parent "${parent.type}" is not linked`).toBe(
        true
      );
    }
  });

  it("resolves every reference to a local id in the set (AC2)", () => {
    const set = buildImportSet({
      clients: [{ id: "c1" }],
      products: [{ id: "p1" }],
      contracts: [{ id: "ct1", client_id: "c1" }],
      invoices: [
        {
          id: "inv1",
          client_id: "c1",
          contract_id: "ct1",
          invoice_product_product_id: "p1"
        }
      ]
    });

    const clientIds = fileOf(set, "clients")!.localIds;
    const contractIds = fileOf(set, "contracts")!.localIds;
    const productIds = fileOf(set, "products")!.localIds;
    const invoiceRow = fileOf(set, "invoices")!.rows[0].values;

    expect(clientIds).toContain(invoiceRow.client_id);
    expect(contractIds).toContain(invoiceRow.contract_id);
    expect(productIds).toContain(invoiceRow.invoice_product_product_id);
  });

  it("writes only synthetic values — no email outside example.com (AC4)", () => {
    const set = buildImportSet({
      clients: [{ id: "c1" }, { id: "c2" }],
      users: [{ id: "u1" }],
      clientPaymentDetails: [{ id: "pd1", client_id: "c1" }]
    });

    const emails = allCellValues(set).filter(v => /@/.test(v));
    expect(emails.length).toBeGreaterThan(0);
    for (const email of emails) {
      expect(email, `non-example.com email emitted: ${email}`).toMatch(
        /@example\.com$/
      );
    }
  });

  it("writes no row that matches a row of the real export (AC4)", ctx => {
    if (!existsSync(REAL_EXPORT_DIR)) {
      ctx.skip(
        `real export dir absent for PII cross-check: ${REAL_EXPORT_DIR}`
      );
      return;
    }
    const realHashes = realExportRowHashes();
    const set = buildImportSet({
      clients: [{ id: "c1" }],
      products: [{ id: "p1" }],
      invoices: [
        { id: "inv1", client_id: "c1", invoice_product_product_id: "p1" }
      ],
      clientPaymentDetails: [{ id: "pd1", client_id: "c1" }]
    });

    for (const file of set.files) {
      for (const row of file.rows) {
        const line = file.header
          .split(",")
          .map(col => row.values[col] ?? "")
          .join(",");
        const hash = createHash("sha256").update(line).digest("hex");
        expect(
          realHashes.has(hash),
          `emitted ${file.type} row matches a real export row`
        ).toBe(false);
      }
    }
  });

  it("refuses a field no template carries and names the field and template (AC8)", () => {
    expect(() =>
      buildImportSet({ invoices: [{ id: "inv1", proforma: true }] })
    ).toThrow(/proforma/);
    expect(() =>
      buildImportSet({ invoices: [{ id: "inv1", proforma: true }] })
    ).toThrow(/invoices/);
  });
});
