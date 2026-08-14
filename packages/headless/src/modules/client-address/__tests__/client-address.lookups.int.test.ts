// -----------------------------------------------------------------------------
/**
 * @fileoverview address form lookups, dependent fields and the schema pair
 * (integration, AC-18/AC-19/AC-20/AC-21/AC-22/AC-27 — permissive brand config)
 *
 * ## Job To Be Done
 * Prove the form is built from REAL lookups and REAL brand config: countries
 * and regions arrive before the form is usable; changing the country fetches
 * that country's regions and clears a region that does not belong to it
 * (parity row L9, the headless half of the Places story); the brand's
 * region requirement reaches the schema; the country control is locked on an
 * EXISTING address when and only when `CLIENT_ALLOW_ADDRESS_UPDATE === false`
 * (row L4); the restored `type` control ships as a PAIR — a schema property
 * with exactly four options AND a matching uischema control, shown only when
 * editing (rows X8/L5); and the form a consumer renders is the form the
 * machine validates (AC-27).
 *
 * ## Why the FORBIDDING brand config lives in another file
 * `useBrand`'s config query is `staleTime: "static"` over a module-level key
 * store, so the FIRST fetch in a vitest FILE is the only one — an override
 * installed later is never requested, and an assertion written against it
 * would pass on the earlier value rather than on the rule. This file therefore
 * runs entirely on the RECORDED config (`allow_address_update: true`,
 * `required_region_in_address: false`) and proves the permissive direction;
 * the forbidding direction is proven, cold, in
 * `client-address.brand-config.int.test.ts`. Both directions are asserted —
 * neither rule is left as an always-on constant.
 *
 * ## What Breaks If These Fail
 * A client is offered another country's regions, saves an address the API
 * rejects because the country was editable when the brand forbids it, or is
 * shown a required field the form never renders (design.md D-12, the pair law).
 */

import { describe, expect, it } from "vitest";
import {
  ADDRESS_TYPE_KEYS,
  AddressTypes,
  ClientAddressContextTypes,
  useClientAddressManager
} from "..";
import { ScopeActorTypes } from "../../scope/scope.types";
import {
  installAddressHandler,
  installLookupHandlers,
  recorded,
  regionCountryId,
  seedClientSession
} from "./client-address.int-helpers";
import { server } from "./setup.integration";

// -----------------------------------------------------------------------------

type JsonSchema = Record<string, unknown> & {
  required?: string[];
  properties?: Record<string, JsonSchema>;
  definitions?: Record<string, JsonSchema>;
  oneOf?: Array<{ const: number; title: string }>;
  enum?: string[];
  rule?: { effect?: string };
};

type UiNode = Record<string, unknown> & {
  type?: string;
  scope?: string;
  rule?: { effect?: string };
  elements?: UiNode[];
  options?: Record<string, unknown> & { detail?: UiNode };
};

/** Every node of a uischema tree, including the ones nested under `options.detail`. */
function uiNodes(node: UiNode | undefined): UiNode[] {
  if (!node || typeof node !== "object") return [];
  const children = [
    ...(node.elements ?? []),
    ...(node.options?.detail ? [node.options.detail] : [])
  ];
  return [node, ...children.flatMap(child => uiNodes(child as UiNode))];
}

/** The control addressing `#/properties/<name>`, wherever it sits in the tree. */
function control(node: UiNode | undefined, name: string): UiNode | undefined {
  return uiNodes(node).find(entry => entry.scope === `#/properties/${name}`);
}

/** Opens an editor over the recorded single-read row. */
async function openExisting() {
  const { clientId } = await seedClientSession();
  installLookupHandlers(server);
  const row = recorded.one().data;
  installAddressHandler(server, clientId, row);
  const manager = useClientAddressManager()
    .as(ScopeActorTypes.CLIENT)
    .for(ClientAddressContextTypes.ADDRESS, row.id);
  await manager.useActions().isReady();
  return { manager, row };
}

/** Opens a blank draft. */
async function openDraft() {
  await seedClientSession();
  const lookups = installLookupHandlers(server);
  const manager = useClientAddressManager().as(ScopeActorTypes.CLIENT).fresh();
  await manager.useActions().isReady();
  return { manager, lookups };
}

/** Lands a partial model through the debounced input and lets it settle. */
async function type(
  manager: { useActions: () => { input: (model: never) => unknown } },
  patch: unknown
): Promise<void> {
  manager.useActions().input(patch as never);
  await new Promise(resolve => setTimeout(resolve, 900));
}

// -----------------------------------------------------------------------------

describe("address form lookups — real countries and regions before the form is usable (AC-18)", () => {
  it("AC-18 reports the form unavailable until the lookups settle, then offers the recorded countries", async () => {
    const { manager } = await openDraft();

    expect(manager.useMeta().isAvailable.value).toBe(true);
    const countries = manager.useContext().countries.value ?? [];
    expect(countries.length).toBe(recorded.countries().data.length);
    const schema = manager.useContext().schema.value as JsonSchema;
    expect(
      schema.definitions?.address?.properties?.countryId?.enum?.length
    ).toBe(recorded.countries().data.length);
  });

  it("AC-18 offers the regions of the address's own country when one is already chosen", async () => {
    const { manager, row } = await openExisting();

    expect(manager.useContext().country.value?.id).toBe(row.country_id);
    const regions = manager.useContext().regions.value ?? [];
    expect(regions.length).toBeGreaterThan(0);
    expect(regions.every(region => region.country_id === row.country_id)).toBe(
      true
    );
  });
});

describe("address form dependent fields — changing the country (AC-19)", () => {
  it("AC-19 fetches the NEW country's regions and offers them instead", async () => {
    const { clientId } = await seedClientSession();
    const lookups = installLookupHandlers(server);
    const row = recorded.one().data;
    installAddressHandler(server, clientId, row);
    const manager = useClientAddressManager()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientAddressContextTypes.ADDRESS, row.id);
    await manager.useActions().isReady();
    const otherCountryId = regionCountryId(recorded.regionsB());
    expect(otherCountryId).not.toBe(row.country_id);

    await type(manager, { address: { countryId: otherCountryId } });

    expect(lookups.regionRequests()).toContain(otherCountryId);
    expect(manager.useContext().country.value?.id).toBe(otherCountryId);
    const regions = manager.useContext().regions.value ?? [];
    expect(regions.map(region => region.id)).toEqual(
      recorded.regionsB().data.map(region => region.id)
    );
  });

  it("AC-19 clears a region that does not belong to the new country", async () => {
    const { clientId } = await seedClientSession();
    installLookupHandlers(server);
    const row = recorded.one().data;
    installAddressHandler(server, clientId, row);
    const manager = useClientAddressManager()
      .as(ScopeActorTypes.CLIENT)
      .for(ClientAddressContextTypes.ADDRESS, row.id);
    await manager.useActions().isReady();
    expect(manager.useContext().model.value.address.regionId).toBe(
      row.region_id
    );
    const otherCountryId = regionCountryId(recorded.regionsB());
    expect(
      recorded.regionsB().data.some(region => region.id === row.region_id)
    ).toBe(false);

    await type(manager, { address: { countryId: otherCountryId } });

    expect(
      manager.useContext().model.value.address.regionId ?? null
    ).toBeNull();
  });
});

describe("address form — the country stays free when the brand allows it (AC-21)", () => {
  it("AC-21 leaves the country control free on an existing address when the brand allows the change", async () => {
    const { manager } = await openExisting();

    const countryControl = control(
      manager.useContext().uischema.value as UiNode,
      "countryId"
    );
    expect(countryControl).toBeDefined();
    expect(countryControl!.rule).toBeUndefined();
  });
});

describe("address form — the brand's region rule reaches the schema (AC-20)", () => {
  it("AC-20 leaves the region optional when this brand does not require one, and still requires the rest", async () => {
    const { manager } = await openDraft();

    const schema = manager.useContext().schema.value as JsonSchema;
    expect(schema.definitions?.address?.required).not.toContain("regionId");
    expect(schema.definitions?.address?.required).toEqual(
      expect.arrayContaining(["address1", "city", "postcode", "countryId"])
    );
  });

  it("AC-20 exposes both brand-config values the form reads", async () => {
    const { manager } = await openDraft();

    const config = manager.useContext().config.value;
    expect(JSON.stringify(config)).toContain("required_region_in_address");
    expect(JSON.stringify(config)).toContain("allow_address_update");
  });
});

describe("address form — I say what kind of address this is (AC-22)", () => {
  it("AC-22 offers exactly the four address types, defaulting to Home", async () => {
    const { manager } = await openDraft();

    const schema = manager.useContext().schema.value as JsonSchema;
    const typeProperty = schema.properties?.type;
    expect(typeProperty).toBeDefined();
    expect(typeProperty!.oneOf?.map(entry => entry.const)).toEqual(
      AddressTypes.map(entry => entry.key)
    );
    expect(typeProperty!.oneOf?.map(entry => entry.title)).toEqual(
      AddressTypes.map(entry => entry.value)
    );
    expect(typeProperty!.default).toBe(ADDRESS_TYPE_KEYS.HOME);
  });

  it("AC-22 ships the type control as a PAIR — schema property AND uischema control — when editing", async () => {
    const { manager } = await openExisting();

    const schema = manager.useContext().schema.value as JsonSchema;
    expect(schema.properties?.type).toBeDefined();
    expect(
      control(manager.useContext().uischema.value as UiNode, "type")
    ).toBeDefined();
  });

  it("AC-22 shows no type control while adding a brand new address", async () => {
    const { manager } = await openDraft();

    expect(
      control(manager.useContext().uischema.value as UiNode, "type")
    ).toBeUndefined();
  });

  it("AC-22 carries the saved row's own type onto the form", async () => {
    const { manager, row } = await openExisting();

    expect(manager.useContext().model.value.type).toBe(row.type);
    const schema = manager.useContext().schema.value as JsonSchema;
    expect(schema.properties?.type?.default).toBe(row.type);
  });
});

describe("address form — the form I am shown is the form that is checked (AC-27)", () => {
  it("AC-27 renders a control for every required address field and nothing the schema does not define", async () => {
    const { manager } = await openExisting();
    const schema = manager.useContext().schema.value as JsonSchema;
    const nodes = uiNodes(manager.useContext().uischema.value as UiNode);
    const scopes = nodes
      .map(node => node.scope)
      .filter((scope): scope is string => typeof scope === "string")
      .map(scope => scope.replace("#/properties/", ""));

    for (const field of schema.definitions?.address?.required ?? []) {
      expect(scopes).toContain(field);
    }
    const known = new Set([
      ...Object.keys(schema.properties ?? {}),
      ...Object.keys(schema.definitions?.address?.properties ?? {})
    ]);
    for (const scope of scopes) {
      expect(known.has(scope)).toBe(true);
    }
  });

  it("AC-27 requires a name only when editing an existing address", async () => {
    const existing = await openExisting();
    expect(
      (existing.manager.useContext().schema.value as JsonSchema).required
    ).toContain("name");

    const draft = await openDraft();
    expect(
      (draft.manager.useContext().schema.value as JsonSchema).required
    ).not.toContain("name");
  });

  it("AC-27 offers the address-autocomplete seam on a new address only", async () => {
    const draft = await openDraft();
    expect(
      uiNodes(draft.manager.useContext().uischema.value as UiNode).some(
        node => node.type === "address"
      )
    ).toBe(true);

    const existing = await openExisting();
    expect(
      uiNodes(existing.manager.useContext().uischema.value as UiNode).some(
        node => node.type === "address"
      )
    ).toBe(false);
  });
});
