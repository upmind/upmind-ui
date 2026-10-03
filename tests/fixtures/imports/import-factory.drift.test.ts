/**
 * @fileoverview import-factory template drift test (AC9)
 *
 * ## Job To Be Done
 * Prove every committed `templates/<type>.csv` header is byte-for-byte the header
 * of the same file in the upstream template repository
 * (`github.com/upmind/csv-import-examples`). A changed upstream header must fail
 * the check and name the template, so the factory never writes a column the
 * importer no longer accepts.
 *
 * ## What Breaks If These Fail
 * The factory builds import files against a stale header. Staging rejects the
 * upload, or silently drops a column, and every recorder that leans on the
 * factory arranges the wrong data.
 *
 * The check reads the committed headers directly; it does not import the factory.
 * When the upstream repository is unreachable each template skips with its named
 * cause — it never passes silently.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const RAW_BASE =
  "https://raw.githubusercontent.com/upmind/csv-import-examples/main";

const TEMPLATES = [
  "clients",
  "users",
  "products",
  "contracts",
  "invoices",
  "client-payment-details"
] as const;

function committedHeader(name: string): string {
  const path = fileURLToPath(
    new URL(`./templates/${name}.csv`, import.meta.url)
  );
  return readFileSync(path, "utf8").split("\n")[0].replace(/\r$/, "");
}

type UpstreamHeader =
  | { ok: true; header: string }
  | { ok: false; cause: string };

async function upstreamHeader(name: string): Promise<UpstreamHeader> {
  let res: Response;
  try {
    res = await fetch(`${RAW_BASE}/${name}.csv`);
  } catch (error) {
    return { ok: false, cause: `network error reaching ${name}.csv: ${error}` };
  }
  if (!res.ok) {
    return { ok: false, cause: `${name}.csv upstream returned ${res.status}` };
  }
  const body = await res.text();
  return { ok: true, header: body.split("\n")[0].replace(/\r$/, "") };
}

describe("template header drift (AC9)", () => {
  it.each(TEMPLATES)(
    "%s committed header equals the upstream header",
    async (name, ctx) => {
      const upstream = await upstreamHeader(name);
      if (!upstream.ok) {
        ctx.skip(
          `template repository unavailable for ${name}: ${upstream.cause}`
        );
        return;
      }
      expect(
        committedHeader(name),
        `drift in template "${name}": committed header differs from upstream`
      ).toBe(upstream.header);
    }
  );
});
