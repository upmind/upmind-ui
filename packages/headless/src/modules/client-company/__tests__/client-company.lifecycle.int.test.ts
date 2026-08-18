// -----------------------------------------------------------------------------
/**
 * @fileoverview client-company lifecycle + feedback-silence guarantees (AC-13, AC-24, AC-29)
 *
 * ## Job To Be Done
 * AC-13/AC-24 prove `destroy()` on both surfaces releases the scope-registry
 * entry — the key count drops by exactly one, a fresh `.as()`/`.for()` mints a
 * DIFFERENT object identity, and the count returns to its prior value. Object
 * identity alone cannot distinguish a released entry from a shadowed one; the
 * key count can (parity.yaml C16/C30).
 *
 * AC-29 prove the module raises NOTHING — a 500 on delete and on set-default
 * surface through state (`useMeta().hasError` / `context.error`) while a
 * proxy spy over `useFeedback`'s methods records ZERO calls, and,
 * structurally, no non-comment line in any module source file references
 * `useFeedback` at all.
 *
 * `client-company.feedback.must-fail.patch` re-introduces the `addError` call
 * in `remove` and must flip both the spy-count and structural assertions RED.
 *
 * ## What Breaks If These Fail
 * AC-13/AC-24: every mount leaks a live TanStack observer / XState
 * interpreter at `staleTime: DAY` (the sibling bundle's Review warning W-B
 * receipt). AC-29: headless starts owning UI feedback again.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import {
  ClientCompanyContextTypes,
  useClientCompanies,
  useClientCompanyManager
} from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  clientCompanyScopeKeys,
  recorded,
  recordedRows,
  seedClientSession
} from "./client-company.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const feedback = vi.hoisted(() => ({ calls: [] as string[] }));

// The spy watches the RAISING methods, not `useFeedback()` itself — the shared
// platform (query/data-manager) may legitimately resolve the composable
// elsewhere; AC-29's read-back is about messages RAISED. The "client-company
// imports no feedback at all" half is asserted structurally below.
vi.mock("../../feedback", async importOriginal => {
  const actual = await importOriginal<typeof import("../../feedback")>();
  const watched = new Set(["addSuccess", "addError", "addWarning", "addInfo"]);
  return {
    ...actual,
    useFeedback: (...args: unknown[]) => {
      const api = (
        actual.useFeedback as unknown as (
          ...a: unknown[]
        ) => Record<string, unknown>
      )(...args);
      return new Proxy(api, {
        get(target, property) {
          const value = Reflect.get(target, property);
          if (typeof value === "function" && watched.has(String(property))) {
            return (...callArgs: unknown[]) => {
              feedback.calls.push(String(property));
              return (value as (...a: unknown[]) => unknown).apply(
                target,
                callArgs
              );
            };
          }
          return value;
        }
      });
    }
  };
});

// -----------------------------------------------------------------------------

const MODULE_DIR = join(import.meta.dirname, "..");

function moduleSourceFiles(): string[] {
  return readdirSync(MODULE_DIR).filter(entry => entry.endsWith(".ts"));
}

function moduleFilesReferencing(token: string): string[] {
  return moduleSourceFiles().filter(file =>
    readFileSync(join(MODULE_DIR, file), "utf-8")
      .split("\n")
      .some(line => {
        const trimmed = line.trim();
        const isComment =
          trimmed.startsWith("//") ||
          trimmed.startsWith("*") ||
          trimmed.startsWith("/*");
        return !isComment && line.includes(token);
      })
  );
}

// -----------------------------------------------------------------------------

describe("client-company collection lifecycle (AC-13)", () => {
  it("AC-13 destroy() releases the scope entry and the next open mints a fresh collection", async () => {
    await seedClientSession();

    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await companies.useActions().isReady();
    const firstQuery = companies.useInternals().query;
    const keyCount = clientCompanyScopeKeys().length;
    expect(keyCount).toBeGreaterThan(0);

    companies.useActions().destroy();

    expect(clientCompanyScopeKeys()).toHaveLength(keyCount - 1);

    const reopened = useClientCompanies().as(ScopeActorTypes.CLIENT);
    expect(reopened.useInternals().query).not.toBe(firstQuery);
    expect(clientCompanyScopeKeys()).toHaveLength(keyCount);
  });
});

describe("client-company manager lifecycle (AC-24)", () => {
  it("AC-24 destroy() releases the manager and the next open mints a fresh instance; no further request follows", async () => {
    await seedClientSession();
    const target = recorded.one().data as { id: string };

    const manager = useClientCompanyManager()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientCompanyContextTypes.COMPANY, target.id);
    await manager.useActions().isReady();
    const firstService = manager.useInternals().service;
    const keyCount = clientCompanyScopeKeys().length;
    expect(keyCount).toBeGreaterThan(0);

    manager.useActions().destroy();
    expect(clientCompanyScopeKeys()).toHaveLength(keyCount - 1);

    const observed: string[] = [];
    const listener = ({ request }: { request: Request }): void => {
      if (request.url.includes("/companies")) observed.push(request.url);
    };
    server?.events.on("request:start", listener);
    await new Promise(resolve => setTimeout(resolve, 300));
    server?.events.removeListener("request:start", listener);
    expect(observed).toEqual([]);

    const reopened = useClientCompanyManager()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientCompanyContextTypes.COMPANY, target.id);
    expect(reopened.useInternals().service).not.toBe(firstService);
    expect(clientCompanyScopeKeys()).toHaveLength(keyCount);
  });
});

describe("client-company — problems are reported, never announced (AC-29)", () => {
  it("AC-29 lands a rejected delete on the collection's own error state, and raises no feedback", async () => {
    feedback.calls.length = 0;
    const { clientId } = await seedClientSession();
    const { primary } = recordedRows();

    server?.use(
      http.get(`*/clients/${clientId}/companies`, () =>
        HttpResponse.json(
          { ...recorded.list(), data: [primary], total: 1 },
          { status: 200 }
        )
      ),
      http.delete(`*/clients/${clientId}/companies/${primary.id}`, () =>
        HttpResponse.json(
          { status: "error", error: { code: 500 } },
          { status: 500 }
        )
      )
    );

    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await companies.useActions().isReady();

    await expect(
      companies.useActions().remove(primary.id)
    ).rejects.toBeDefined();

    await vi.waitFor(() =>
      expect(companies.useMeta().hasError.value).toBe(true)
    );
    expect(companies.useContext().error.value).toBeDefined();
    expect(feedback.calls).toEqual([]);
  });

  it("AC-29 lands a rejected set-default on the collection's own error state, and raises no feedback", async () => {
    feedback.calls.length = 0;
    const { clientId } = await seedClientSession();
    const { primary } = recordedRows();

    server?.use(
      http.get(`*/clients/${clientId}/companies`, () =>
        HttpResponse.json(
          { ...recorded.list(), data: [primary], total: 1 },
          { status: 200 }
        )
      ),
      http.put(`*/clients/${clientId}/companies/${primary.id}`, () =>
        HttpResponse.json(
          { status: "error", error: { code: 500 } },
          { status: 500 }
        )
      )
    );

    const companies = useClientCompanies().as(ScopeActorTypes.CLIENT);
    await companies.useActions().isReady();

    await expect(
      companies.useActions().setDefault(primary.id)
    ).rejects.toBeDefined();

    await vi.waitFor(() =>
      expect(companies.useMeta().hasError.value).toBe(true)
    );
    expect(feedback.calls).toEqual([]);
  });

  it("AC-29 raises nothing because the module never reaches for the feedback surface at all", () => {
    expect(moduleFilesReferencing("useFeedback")).toEqual([]);
  });
});
