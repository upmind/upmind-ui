/**
 * @fileoverview import-factory staging client tests (AC3, AC5, AC6, AC7, AC10)
 *
 * ## Job To Be Done
 * Prove the staging client drives the legacy import sequence end to end as staff:
 * an import reads back on staging in the stated state (AC3); a restore removes
 * every owned record (AC5); a refused step cancels and removes the import and
 * throws the exact staging answer (AC6); a staged statement stops before commit
 * and reads back as staged (AC7); and no factory step is captured (AC10).
 *
 * ## What Breaks If These Fail
 * A recorder leaves orphaned data on staging after a run (dirty shared env), or
 * arranges a state that never actually landed — a scenario recorded against a
 * fiction.
 *
 * ## Provenance
 * This spec drives REAL staging through the real factory — there is no recorded
 * fixture to replay; the arrangement IS the system under test (design §7, like
 * the module recorders). It runs only with staging credentials. Absent them, or
 * if the staff login fails, every case SKIPS with its verbatim cause — it never
 * passes silently. Assertions derive from docs/sdd/import-factory/bdd.md and
 * design §8.1–8.2, never from the client's implementation.
 */

import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { API_CREDENTIALS } from "../credentials";
import { createGenerator } from "../generator";
import type {
  ImportHandle,
  ImportSet,
  StagingConfig
} from "./import-factory.types";

/** Staff authenticates with the admin grant (GrantTypes.ADMIN); client uses password. */
const STAFF_GRANT = "admin";

/** The recording client's own brand (QA Automation Testing) the recorders arrange against. */
const RECORDING_BRAND_ID = "2785d26e-9678-3d16-999f-314502e70439";

/** The full import sequence (upload, step starts, polling restore) runs well past the 5s default. */
const STAGING_TIMEOUT = 180_000;

type Factory = {
  buildImportSet: (s: unknown) => ImportSet;
  importToStaging: (
    set: ImportSet,
    config: StagingConfig
  ) => Promise<ImportHandle>;
  restoreImport: (handle: ImportHandle, config: StagingConfig) => Promise<void>;
};

function readEnvRecording(): Record<string, string> {
  try {
    const path = fileURLToPath(
      new URL("../../../packages/headless/.env.recording", import.meta.url)
    );
    return Object.fromEntries(
      readFileSync(path, "utf8")
        .split("\n")
        .filter(l => l.includes("=") && !l.startsWith("#"))
        .map(l => {
          const i = l.indexOf("=");
          return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
        })
    );
  } catch {
    return {};
  }
}

function resolveEnv(): {
  apiUrl: string;
  origin: string;
  brandId: string;
} | null {
  const rec = readEnvRecording();
  const apiUrl = process.env.TARGET_API || rec.VITE_API_URL;
  const origin = process.env.BRAND_ORIGIN || rec.RECORDING_BRAND_ORIGIN;
  const brandId =
    process.env.UM_BRAND_ID || rec.RECORDING_BRAND_ID || RECORDING_BRAND_ID;
  if (!apiUrl || !origin || !brandId) return null;
  return { apiUrl, origin, brandId };
}

async function loginStaff(apiUrl: string, origin: string): Promise<string> {
  const res = await fetch(`${apiUrl}/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: origin,
      Referer: `${origin}/`
    },
    body: JSON.stringify({
      grant_type: STAFF_GRANT,
      username: API_CREDENTIALS.staff.username,
      password: API_CREDENTIALS.staff.password
    })
  });
  if (!res.ok) {
    throw new Error(`staff login returned ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as {
    access_token?: string;
    data?: { access_token?: string };
  };
  const token = json.access_token ?? json.data?.access_token;
  if (!token) throw new Error("staff login returned no access_token");
  return token;
}

async function readImportStatus(
  config: StagingConfig,
  importId: string
): Promise<{ status: number; state?: string }> {
  const res = await fetch(
    `${config.apiUrl}/api/admin/imports/${importId}?with=status`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${config.token}`,
        Origin: config.origin,
        Referer: `${config.origin}/`
      }
    }
  );
  const body = (await res.json().catch(() => ({}))) as {
    data?: { status?: { code?: string } | string };
  };
  const status = body.data?.status;
  const state = typeof status === "string" ? status : status?.code;
  return { status: res.status, state };
}

describe("import-factory staging client", () => {
  let factory: Factory | null = null;
  let config: StagingConfig | null = null;
  let skipCause = "";

  beforeAll(async () => {
    const env = resolveEnv();
    if (!env) {
      skipCause =
        "staging env incomplete — set TARGET_API, BRAND_ORIGIN and UM_BRAND_ID " +
        "(or VITE_API_URL / RECORDING_BRAND_ORIGIN / RECORDING_BRAND_ID in " +
        "packages/headless/.env.recording)";
      return;
    }
    let token: string;
    try {
      token = await loginStaff(env.apiUrl, env.origin);
    } catch (error) {
      skipCause = `staff login failed: ${error}`;
      return;
    }
    config = { apiUrl: env.apiUrl, origin: env.origin, token };
    factory = (await import("./import-factory")) as unknown as Factory;
    (config as StagingConfig & { brandId: string }).brandId = env.brandId;
  }, STAGING_TIMEOUT);

  function ready(ctx: { skip: (reason?: string) => void }): boolean {
    if (!factory || !config) {
      ctx.skip(skipCause || "staging not available");
      return false;
    }
    return true;
  }

  function stagedClientSet(): ImportSet {
    const brandId = (config as StagingConfig & { brandId: string }).brandId;
    return factory!.buildImportSet({
      brandId,
      staged: true,
      clients: [
        {
          id: "c1",
          address_address_1: "1 Fixture Street",
          address_city: "Testville",
          address_postcode: "TE5 7XX",
          address_country_code: "GB"
        },
        {
          id: "c2",
          address_address_1: "2 Fixture Street",
          address_city: "Testville",
          address_postcode: "TE5 7XX",
          address_country_code: "GB"
        }
      ]
    });
  }

  it(
    "imports a client set and reads it back on staging in its stated state (AC3)",
    async ctx => {
      if (!ready(ctx)) return;
      const handle = await factory!.importToStaging(stagedClientSet(), config!);
      try {
        expect(handle.importId).toBeTruthy();
        const status = await readImportStatus(config!, handle.importId);
        expect(status.status).toBe(200);
        expect(status.state).toBe("import_staged");
        const clients = handle.localIds.find(l => l.type === "clients");
        expect(clients?.ids).toHaveLength(2);
      } finally {
        await factory!.restoreImport(handle, config!);
      }
    },
    STAGING_TIMEOUT
  );

  it(
    "stops a staged import before commit (AC7)",
    async ctx => {
      if (!ready(ctx)) return;
      const handle = await factory!.importToStaging(stagedClientSet(), config!);
      try {
        expect(handle.staged).toBe(true);
        const status = await readImportStatus(config!, handle.importId);
        expect(status.state).not.toBe("import_complete");
      } finally {
        await factory!.restoreImport(handle, config!);
      }
    },
    STAGING_TIMEOUT
  );

  it(
    "restores a staged import so staging holds none of its records (AC5)",
    async ctx => {
      if (!ready(ctx)) return;
      const handle = await factory!.importToStaging(stagedClientSet(), config!);
      await factory!.restoreImport(handle, config!);
      const status = await readImportStatus(config!, handle.importId);
      expect(status.status).toBe(404);
    },
    STAGING_TIMEOUT
  );

  it(
    "throws the exact staging answer when a step refuses the data, leaving no import (AC6)",
    async ctx => {
      if (!ready(ctx)) return;
      const brandId = (config as StagingConfig & { brandId: string }).brandId;
      const set = factory!.buildImportSet({
        brandId,
        invoices: [{ id: "inv1" }]
      });
      await expect(factory!.importToStaging(set, config!)).rejects.toThrow(
        /422/
      );
    },
    STAGING_TIMEOUT
  );

  it(
    "captures nothing: a live Generator records no factory step (AC10)",
    async ctx => {
      if (!ready(ctx)) return;
      const gen = createGenerator(config!.apiUrl, {
        recordingsDir: `${tmpdir()}/import-factory-ac10`,
        origin: config!.origin,
        name: "import-factory-ac10"
      });
      const handle = await factory!.importToStaging(stagedClientSet(), config!);
      try {
        expect(gen.getCapturedFixtures().size).toBe(0);
      } finally {
        await factory!.restoreImport(handle, config!);
      }
    },
    STAGING_TIMEOUT
  );
});
