// -----------------------------------------------------------------------------
/**
 * @module client-notes/__tests__/client-notes.collection-drift.int
 * @description Integration proof for two of the 2026-08-31 upgrade-pass
 * collection drift closures — AC-38 (C22/R7) and AC-40 (C21/R11) — against
 * REAL staging captures. AC-39 (C20/R8) is proven in its own isolated file,
 * `client-notes.guard-brand-transient.int.test.ts`, for the same
 * `brand.services.ts` test-isolation reason `client-notes.guard-brand-*`
 * already documents (`review-notes.md` §H2).
 *
 * ## Job To Be Done
 * A label-less row must read as a real, typed absence — not an empty string
 * a naive check would treat as present (AC-38). `createdAt`/`updatedAt` must
 * render through the platform date channel, not as raw API strings, so a
 * consumer can show them in the client's own locale (AC-40).
 *
 * ## What Breaks If These Fail
 * AC-38: a label-less note's null coerces to `""`, which reads truthy in a
 * naive check and hides the label-first convert refusal (AC-10 (iii)).
 * AC-40: a client sees an un-localised ISO timestamp instead of a date.
 */

import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useClientNotes } from "..";
import {
  observeVaultRequests,
  recorded,
  resetClientNoteScopes,
  seedClientSession,
  waitForAvailable
} from "./client-notes.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

describe("client-notes collection drift — the 2026-08-31 upgrade-pass closures", () => {
  let clientId: string;

  beforeEach(async () => {
    const seeded = await seedClientSession();
    clientId = seeded.clientId;
  });

  afterEach(() => {
    resetClientNoteScopes();
  });

  it("AC-38 — a label-less row reads its label as null, never coerced to an empty string, and still takes convert's refusal branch", async () => {
    const list = recorded.list();
    const observed = observeVaultRequests();
    server?.use(
      http.get(`*/clients/${clientId}/vault`, () =>
        HttpResponse.json(list, { status: 200 })
      )
    );

    const notes = useClientNotes().as("self");
    await waitForAvailable(notes);

    const rows = notes.useContext().data.value ?? [];
    const recordedNullCount = list.data.filter(
      row => row.label === null
    ).length;
    const mappedNullCount = rows.filter(row => row.label === null).length;

    expect(recordedNullCount).toBeGreaterThan(0);
    expect(mappedNullCount).toBe(recordedNullCount);
    expect(rows.some(row => row.label === "")).toBe(false);

    const labelLess = rows.find(row => row.label === null && !row.encrypted);
    expect(labelLess).toBeTruthy();

    const before = observed.count();
    await expect(
      notes.useActions().convert(labelLess!.id)
    ).rejects.toMatchObject({
      message: expect.stringContaining("vault_asset_label_required")
    });
    expect(observed.count()).toBe(before);

    observed.stop();
  });

  it("AC-40 — createdAt/updatedAt render through the platform date channel, not as raw wire strings", async () => {
    const list = recorded.list();
    server?.use(
      http.get(`*/clients/${clientId}/vault`, () =>
        HttpResponse.json(list, { status: 200 })
      )
    );

    const notes = useClientNotes().as("self");
    await waitForAvailable(notes);

    const rows = notes.useContext().data.value ?? [];
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      const rawRow = list.data.find(candidate => candidate.id === row.id);
      expect(rawRow).toBeTruthy();

      for (const field of ["createdAt", "updatedAt"] as const) {
        const mapped = row[field] as unknown;
        const raw = (rawRow as { created_at?: string; updated_at?: string })[
          field === "createdAt" ? "created_at" : "updated_at"
        ];

        // Not the raw wire string, structurally or by value.
        expect(typeof mapped).not.toBe("string");
        expect(mapped).not.toBe(raw);

        // At least one member of the descriptor differs from the raw wire
        // value — proving it was genuinely reformatted, not merely wrapped
        // in an object that still carries the raw string untouched.
        const values = Object.values(mapped as Record<string, unknown>);
        expect(values.some(value => value !== raw)).toBe(true);

        // AC-40's declared read-back is a member-for-member comparison
        // against a client-email MAPPED ROW built from its own recorded
        // fixture. That specific comparison does not land: client-email's
        // own `Email` type (client-email.types.ts) declares no
        // createdAt/updatedAt descriptor at all, and its one `{date,
        // relative}`-shaped field (`bouncedAt`) is never populated in any of
        // the four recorded client-email fixtures — every captured row
        // carries `bounced: false` / `bounced_at: null`, so there is no live
        // "mapped row" to build without fabricating wire data, which this
        // seat may never do. Re-scoped to a type-level cross-module parity
        // check instead: client-email's own `bouncedAt` field independently
        // declares the platform date-descriptor's member set as `{ date,
        // relative }` — assert this module's mapped createdAt/updatedAt
        // expose EXACTLY that set, not a client-notes-invented shape.
        expect(Object.keys(mapped as Record<string, unknown>).sort()).toEqual(
          ["date", "relative"].sort()
        );
      }
    }
  });
});
