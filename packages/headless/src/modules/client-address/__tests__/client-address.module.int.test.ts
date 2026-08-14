// -----------------------------------------------------------------------------
/**
 * @fileoverview one front door — the module works end to end through the
 * BARREL alone (integration, AC-35/AC-36)
 *
 * ## Job To Be Done
 * AC-35's read-back is that a consumer importing ONLY from
 * `packages/headless/src/modules/client-address` can list, read, edit and
 * mutate addresses against recorded fixtures — no deep path, no retired
 * `useClientAddressServices`. AC-36's is that the members the barrel offers
 * actually do something: `ensure` takes the model DIRECTLY (R4's replacement
 * for `useClientAddressServices().ensure({ model })`), `mapAddress` maps a real
 * recorded row, and no file outside this module reaches past the barrel.
 *
 * This file imports EXCLUSIVELY from `..` (plus the shared scope enum every
 * consumer uses) — that restriction is the test.
 *
 * ## What Breaks If These Fail
 * A consumer is handed a surface that compiles and does nothing, or the module
 * grows a second front door that the Module Visibility Law exists to prevent.
 */

import { execFileSync } from "node:child_process";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import {
  ClientAddressContextTypes,
  mapAddress,
  useClientAddressManager,
  useClientAddresses
} from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installAddressHandler,
  installAddressesListHandler,
  installLookupHandlers,
  recorded,
  recordedRows,
  seedClientSession
} from "./client-address.int-helpers";
import { server } from "./setup.integration";
import type { IAddress } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const REPO_ROOT = execFileSync("git", ["rev-parse", "--show-toplevel"], {
  encoding: "utf-8"
}).trim();

// -----------------------------------------------------------------------------

describe("client-address module — one front door (AC-35)", () => {
  it("AC-35 lists, reads and edits through the barrel alone", async () => {
    const { clientId } = await seedClientSession();
    installLookupHandlers(server);
    const { primary, secondary } = recordedRows();
    installAddressesListHandler(server, clientId, [primary, secondary]);
    const row = recorded.one().data;
    installAddressHandler(server, clientId, row);

    const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
    await vi.waitFor(() =>
      expect(addresses.useContext().data.value).toHaveLength(2)
    );
    expect(addresses.useContext().getOne(primary.id)?.id).toBe(primary.id);
    expect(addresses.useContext().default()).toBe(
      [primary, secondary].find(entry => entry.default)?.id
    );

    const manager = useClientAddressManager()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientAddressContextTypes.ADDRESS, row.id);
    await manager.useActions().isReady();
    expect(manager.useContext().model.value.id).toBe(row.id);
    expect(manager.useContext().schema.value).toBeDefined();
    expect(manager.useContext().uischema.value).toBeDefined();
  });

  it("AC-35/R4 offers ensure() on the collection's actions, taking the model DIRECTLY", async () => {
    const { clientId } = await seedClientSession();
    const { primary } = recordedRows();
    installAddressesListHandler(server, clientId, [primary]);
    const posts: unknown[] = [];
    server?.use(
      http.post(`*/clients/${clientId}/addresses`, async ({ request }) => {
        posts.push(await request.json());
        return HttpResponse.json(recorded.created(), { status: 200 });
      })
    );

    const addresses = useClientAddresses().as(ScopeActorTypes.CLIENT);
    await addresses.useActions().isReady();

    expect(typeof addresses.useActions().ensure).toBe("function");
    const existing = await addresses.useActions().ensure({
      id: primary.id,
      address: {
        address1: primary.address_1,
        city: primary.city,
        postcode: primary.postcode,
        countryId: primary.country_id
      }
    } as never);

    expect(existing.id).toBe(primary.id);
    expect(posts).toEqual([]);
  });

  it("AC-36 maps a real recorded row through the barrel's own mapper", () => {
    const { primary } = recordedRows();

    const mapped = mapAddress(primary as unknown as IAddress);

    expect(mapped.id).toBe(primary.id);
    expect(mapped.description).toContain(primary.city);
  });
});

describe("client-address module — nothing reaches inside it by another route (AC-35)", () => {
  it("AC-35 no file outside the module imports its services or mappers by deep path", () => {
    const hits = execFileSync(
      "git",
      [
        "grep",
        "-l",
        "-E",
        "client-address/client-address\\.(services|mappers)",
        "--",
        "packages",
        "apps",
        "playgrounds",
        "tests"
      ],
      { cwd: REPO_ROOT, encoding: "utf-8" }
    )
      .split("\n")
      .filter(Boolean)
      .filter(file => !file.includes("modules/client-address/"));

    expect(hits).toEqual([]);
  });

  it("AC-35/R4 no CODE anywhere still reaches for the retired useClientAddressServices", () => {
    let lines: string[] = [];
    try {
      lines = execFileSync(
        "git",
        [
          "grep",
          "-n",
          "useClientAddressServices",
          "--",
          "packages",
          "apps",
          "playgrounds",
          "tests"
        ],
        { cwd: REPO_ROOT, encoding: "utf-8" }
      )
        .split("\n")
        .filter(Boolean);
    } catch {
      // `git grep` exits 1 with no output when nothing matches — the pass case.
    }

    // Prose survives: the barrel and the actions layer BOTH document the
    // retirement, and a sibling module's negative-control patch quotes it.
    // This spec names the symbol to search for it, which is not a use either.
    // What must not survive is a live reference.
    const live = lines.filter(line => {
      const [file, , ...rest] = line.split(":");
      const source = rest.join(":").trim();
      if (file.endsWith(".patch")) return false;
      // This module's OWN specs name the symbol to assert its ABSENCE — the
      // claim under test is that no CONSUMER still reaches for it.
      if (file.includes("modules/client-address/__tests__/")) return false;
      return !/^(\*|\/\/|\/\*|#)/.test(source);
    });

    expect(live).toEqual([]);
  });
});
