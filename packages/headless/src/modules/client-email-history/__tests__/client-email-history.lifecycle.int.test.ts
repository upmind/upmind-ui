// -----------------------------------------------------------------------------
/**
 * @fileoverview client-email-history — instance lifecycle and error-as-state
 * (AC-12, AC-21)
 *
 * ## Job To Be Done
 * AC-12: discarding the collection releases the scope-registry entry, and a
 * fresh `.as('client')` mints a different instance. AC-21: a failed read lands
 * on `context.error`, readable, while the module raises no feedback of its
 * own — proven by BOTH a spy on the feedback surface (zero calls) and a
 * structural check that neither composable file imports it at all.
 */

import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { useClientReceivedEmails } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installEmailHistoryHandlers,
  moduleFilesReferencing,
  seedClientSession
} from "./client-email-history.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const feedback = vi.hoisted(() => ({ calls: [] as string[] }));

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

describe("client-email-history collection — discard releases the instance (AC-12)", () => {
  it("AC-12 destroy() releases the scope entry; a fresh .as('client') is a different instance", async () => {
    await seedClientSession();
    installEmailHistoryHandlers();

    const first = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() => expect(first.useMeta().isLoading.value).toBe(false));

    first.useActions().destroy();

    const second = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    expect(second).not.toBe(first);
  });
});

describe("client-email-history — problems are reported, never announced (AC-21)", () => {
  it("AC-21 lands a failed read on context.error, and raises no feedback", async () => {
    feedback.calls.length = 0;
    await seedClientSession();
    server?.use(
      http.get("*/self/email_history", () =>
        HttpResponse.json(
          {
            status: "error",
            data: null,
            error: { code: 500, message: "boom" }
          },
          { status: 500 }
        )
      )
    );

    const emails = useClientReceivedEmails().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() => expect(emails.useMeta().hasError.value).toBe(true), {
      timeout: 10000
    });

    expect(emails.useContext().error.value).toBeDefined();
    expect(feedback.calls).toEqual([]);
  });

  it("AC-21 neither composable file imports the feedback surface at all", () => {
    expect(moduleFilesReferencing("useFeedback")).toEqual([]);
  });
});
