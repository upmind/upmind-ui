// -----------------------------------------------------------------------------
/**
 * @fileoverview the module tells the user what happened, and does not
 * interrupt them (integration, AC-14/AC-40)
 *
 * ## Job To Be Done
 * Operator ruling R10 keeps the feedback IN the module, so this is a
 * module-altitude read-back with NO consumer subscribed: `remove` and
 * `setDefault` each land EXACTLY ONE entry on success and EXACTLY ONE on
 * failure, carrying the four keys the module cites — and on failure the
 * caller's promise does NOT reject (AC-14: "nothing I was doing is thrown off
 * course"). Counting matters: a consumer-side raise added on top of the
 * module's would double every message, which is why "at least one" would not
 * discriminate.
 *
 * Both failure bodies are REAL: the 409 staging answers for deleting a row it
 * refuses to delete, and the 422 it answers for a set-default naming an
 * unknown address (`pnpm fixtures:generate client-address`).
 *
 * The locale check is here rather than in a unit file because it is the same
 * contract: a raise whose key resolves nowhere tells the user nothing.
 *
 * ## What Breaks If These Fail
 * A delete silently fails, or a failed mutation rejects a promise chain the
 * consumer never expected to reject and takes the page down with it.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useClientAddresses } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installAddressesListHandler,
  recorded,
  recordedRows,
  seedClientSession
} from "./client-address.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const feedback = vi.hoisted(() => ({
  calls: [] as Array<{ method: string; arg: unknown }>
}));

vi.mock("../../feedback", async importOriginal => {
  const actual = await importOriginal<typeof import("../../feedback")>();
  const watched = new Set(["addSuccess", "addError"]);
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
              feedback.calls.push({
                method: String(property),
                arg: callArgs[0]
              });
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

const LOCALES_DIR = join(
  import.meta.dirname,
  "../../../../../i18n/public/locales"
);

/** The four keys the module raises, by the file each lives in. */
const FEEDBACK_KEYS = {
  confirm: ["address_removed", "address_set_default"],
  error: ["client_address_update_failed", "client_address_set_default_failed"]
};

/** Every message this run's mutations raised, flattened to searchable text. */
function raised(method: "addSuccess" | "addError"): string[] {
  return feedback.calls
    .filter(call => call.method === method)
    .map(call =>
      typeof call.arg === "string" ? call.arg : JSON.stringify(call.arg)
    );
}

async function openCollection() {
  const { clientId } = await seedClientSession();
  const { primary, secondary } = recordedRows();
  const list = installAddressesListHandler(server, clientId, [
    primary,
    secondary
  ]);
  const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
  await vi.waitFor(() =>
    expect(addresses.useContext().data.value).toHaveLength(2)
  );
  return { addresses, list, primary, secondary, clientId };
}

beforeEach(() => {
  feedback.calls.length = 0;
});

// -----------------------------------------------------------------------------

describe("address feedback — a delete tells me what happened (AC-40)", () => {
  it("AC-40 raises EXACTLY ONE success entry on a successful delete, with no consumer subscribed", async () => {
    const { addresses, list, primary, secondary, clientId } =
      await openCollection();
    server?.use(
      http.delete(`*/clients/${clientId}/addresses/${secondary.id}`, () => {
        list.setRows([primary]);
        return HttpResponse.json(recorded.removed(), { status: 200 });
      })
    );

    await addresses.useActions().remove(secondary.id);

    expect(raised("addSuccess")).toHaveLength(1);
    expect(raised("addError")).toHaveLength(0);
  });

  it("AC-14/AC-40 raises EXACTLY ONE error entry on a REAL rejected delete, and does NOT reject the caller", async () => {
    const { addresses, secondary, clientId } = await openCollection();
    const rejection = recorded.removeRejected();
    server?.use(
      http.delete(`*/clients/${clientId}/addresses/${secondary.id}`, () =>
        HttpResponse.json(rejection.response.body as object, {
          status: rejection.response.status
        })
      )
    );

    let rejected = false;
    await addresses
      .useActions()
      .remove(secondary.id)
      .catch(() => {
        rejected = true;
      });

    expect(rejected).toBe(false);
    expect(raised("addError")).toHaveLength(1);
    expect(raised("addError")[0]).toContain("client_address_update_failed");
    expect(raised("addSuccess")).toHaveLength(0);
  });
});

describe("address feedback — a change of default tells me what happened (AC-40)", () => {
  it("AC-40 raises EXACTLY ONE success entry on a successful set-default", async () => {
    const { addresses, list, primary, secondary, clientId } =
      await openCollection();
    server?.use(
      http.put(`*/clients/${clientId}/addresses/${secondary.id}`, () => {
        list.setRows([
          { ...primary, default: false },
          { ...secondary, default: true }
        ]);
        return HttpResponse.json(recorded.defaulted(), { status: 200 });
      })
    );

    await addresses.useActions().setDefault(secondary.id);

    expect(raised("addSuccess")).toHaveLength(1);
    expect(raised("addError")).toHaveLength(0);
  });

  it("AC-14/AC-40 raises EXACTLY ONE error entry on a REAL rejected set-default, and does NOT reject the caller", async () => {
    const { addresses, secondary, clientId } = await openCollection();
    const rejection = recorded.defaultRejected();
    server?.use(
      http.put(`*/clients/${clientId}/addresses/${secondary.id}`, () =>
        HttpResponse.json(rejection.response.body as object, {
          status: rejection.response.status
        })
      )
    );

    let rejected = false;
    await addresses
      .useActions()
      .setDefault(secondary.id)
      .catch(() => {
        rejected = true;
      });

    expect(rejected).toBe(false);
    expect(raised("addError")).toHaveLength(1);
    expect(raised("addError")[0]).toContain(
      "client_address_set_default_failed"
    );
    expect(raised("addSuccess")).toHaveLength(0);
  });
});

describe("address feedback — every key the module raises resolves (AC-40)", () => {
  it("AC-40 carries all four keys in all 28 locales", () => {
    const locales = readdirSync(LOCALES_DIR).filter(
      entry => !entry.startsWith(".")
    );
    expect(locales.length).toBe(28);

    const missing: string[] = [];
    for (const locale of locales) {
      for (const [file, keys] of Object.entries(FEEDBACK_KEYS)) {
        const source = JSON.parse(
          readFileSync(join(LOCALES_DIR, locale, `${file}.json`), "utf-8")
        ) as Record<string, string>;
        for (const key of keys) {
          if (!source[key]) missing.push(`${locale}/${file}.json:${key}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });
});
