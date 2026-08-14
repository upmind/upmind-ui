// -----------------------------------------------------------------------------
/**
 * @fileoverview address form under a FORBIDDING brand config — locked country
 * and a required region (integration, AC-20/AC-21)
 *
 * ## Job To Be Done
 * Prove both brand-config rules the form depends on actually depend on the
 * config value: with `CLIENT_ALLOW_ADDRESS_UPDATE === false` the country
 * control on an EXISTING address carries a disable rule while a NEW address's
 * does not (parity row L4), and with `REQUIRE_REGION_IN_ADDRESS === true` the
 * region joins the schema's required set (row X2). The permissive direction of
 * both is proven in `client-address.lookups.int.test.ts`; between the two
 * files neither rule can be an always-on constant.
 *
 * ## Why this is its OWN file, and what is constructed
 * `useBrand`'s config query is `staleTime: "static"` over a module-level key
 * store: the FIRST fetch in a vitest FILE is the only one, so a forbidding
 * override has to be installed before any other test warms it.
 *
 * The override itself is a DECLARED boundary construction, not a recording.
 * This staging brand answers `allow_address_update: true` /
 * `required_region_in_address: false` and a client credential cannot change
 * either, so no leg reachable with these credentials produces the forbidding
 * state. `installBrandConfigHandler` therefore serves the RECORDED envelope,
 * status and every other key verbatim and flips only those two booleans — the
 * same "server state this account cannot itself reach, replayed in the
 * recorded shape" pattern `client-company.int-helpers` uses for its
 * zero-row list.
 *
 * ## What Breaks If These Fail
 * A client edits the country of a saved address on a brand whose API rejects
 * exactly that (the legacy `lockCountry` rule, addEditClientAddressModal.vue),
 * or saves a region-less address on a brand that requires one.
 */

import { describe, expect, it } from "vitest";
import { ClientAddressContextTypes, useClientAddressManager } from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installAddressHandler,
  installBrandConfigHandler,
  installLookupHandlers,
  observeAllRequests,
  recorded,
  seedClientSession
} from "./client-address.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

const FORBIDDING_CONFIG = {
  "clients.settings.allow_address_update": false,
  "invoices.common.required_region_in_address": true
};

type UiNode = Record<string, unknown> & {
  scope?: string;
  rule?: { effect?: string };
  elements?: UiNode[];
  options?: Record<string, unknown> & { detail?: UiNode };
};

type JsonSchema = Record<string, unknown> & {
  required?: string[];
  definitions?: Record<string, JsonSchema>;
};

function uiNodes(node: UiNode | undefined): UiNode[] {
  if (!node || typeof node !== "object") return [];
  const children = [
    ...(node.elements ?? []),
    ...(node.options?.detail ? [node.options.detail] : [])
  ];
  return [node, ...children.flatMap(child => uiNodes(child as UiNode))];
}

function control(node: UiNode | undefined, name: string): UiNode | undefined {
  return uiNodes(node).find(entry => entry.scope === `#/properties/${name}`);
}

// -----------------------------------------------------------------------------

describe("address form under a forbidding brand config (AC-20, AC-21)", () => {
  it("AC-21 disables the country control on an EXISTING address when the brand forbids the change", async () => {
    const observed = observeAllRequests();
    const { clientId } = await seedClientSession();
    installBrandConfigHandler(server, FORBIDDING_CONFIG);
    installLookupHandlers(server);
    const row = recorded.one().data;
    installAddressHandler(server, clientId, row);

    const manager = useClientAddressManager()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientAddressContextTypes.ADDRESS, row.id);
    await manager.useActions().isReady();
    observed.stop();

    // AC-20/W11: the form's own config fetch has to ASK for both keys — the
    // second one is what this story adds, and a request that never names it
    // could only ever answer with the brand's default.
    const configKeys = observed
      .matching("config/brand/values")
      .flatMap(request =>
        (new URL(request.url).searchParams.get("keys") ?? "").split(",")
      );
    expect(
      configKeys,
      "the brand-config request must NAME both keys the form depends on " +
        "(tasks.md T-8a read-back); observed request(s): " +
        observed
          .matching("config/brand/values")
          .map(request => request.url)
          .join(" | ")
    ).toEqual(
      expect.arrayContaining([
        "clients.settings.allow_address_update",
        "invoices.common.required_region_in_address"
      ])
    );
    const countryControl = control(
      manager.useContext().uischema.value as UiNode,
      "countryId"
    );
    expect(countryControl).toBeDefined();
    expect(countryControl!.rule?.effect).toBe("DISABLE");
  });

  it("AC-21 leaves the country mine to choose on a NEW address under the very same forbidding config", async () => {
    await seedClientSession();
    installBrandConfigHandler(server, FORBIDDING_CONFIG);
    installLookupHandlers(server);

    const manager = useClientAddressManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    await manager.useActions().isReady();

    const countryControl = control(
      manager.useContext().uischema.value as UiNode,
      "countryId"
    );
    expect(countryControl).toBeDefined();
    expect(countryControl!.rule).toBeUndefined();
  });

  it("AC-20 requires a region when the brand demands one", async () => {
    await seedClientSession();
    installBrandConfigHandler(server, FORBIDDING_CONFIG);
    installLookupHandlers(server);

    const manager = useClientAddressManager()
      .as(ScopeActorTypes.CLIENT)
      .fresh();
    await manager.useActions().isReady();

    const schema = manager.useContext().schema.value as JsonSchema;
    expect(schema.definitions?.address?.required).toContain("regionId");
  });
});
