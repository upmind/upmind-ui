// -----------------------------------------------------------------------------
/**
 * @module tests/brand-gates
 * @description Plan R8 / gap X13: the brand gates are the PLATFORM's own
 * config keys, and legacy's `router/client/menu.ts` predicates run as data
 * over them. Every assertion here is differential — a gate proven only on the
 * dataset that happens to ship is a seed read-back, so each one is graded
 * against a dataset sitting on its other branch (R9).
 */

import { describe, expect, it } from "vitest";
import { BrandConfigKeys, OrgFeatureKeys } from "@upmind-automation/types";
import { assign, find, includes, keys, map, values } from "lodash-es";
import type { MockBrandFeatures, MockDataset } from "~/portal/mock/types";
import type { MenuItem } from "~/portal/modules/menu/types";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { HOSTGRID_MINIMAL_MOCK_DATASET } from "~/portal/mock/hostgrid-minimal";
import {
  accountSectionNavItems,
  pillarNavItems,
  pillarSubmenuItems,
  supportPinPanelItems
} from "~/portal/mock/selectors";
import { BRAND_GATE_CONFIG_KEY } from "~/portal/mock/types";

const PLATFORM_KEYS: string[] = [
  ...values(BrandConfigKeys),
  ...values(OrgFeatureKeys)
];

/** The gates R8 records as having no platform key at all. */
const UNMAPPED_GATES = [
  "customStorefrontUrl",
  "hideOneTimePurchases",
  "isUpmindOrgContext",
  "recaptchaEnabled",
  "registrationPasswordRequired",
  "termsUrl",
  "walletTopUpEnabled"
];

const STOREFRONT_URL = "https://store.hostgrid.example/order";

/** A fresh clone with some gates flipped — the seed is deep-frozen, and `features` is readonly. */
function withFeatures(overrides: Partial<MockBrandFeatures>): MockDataset {
  const dataset: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
  return assign(dataset, {
    features: assign({}, dataset.features, overrides)
  });
}

function navLabels(dataset: MockDataset): string[] {
  return map(pillarNavItems(dataset), item => item.label);
}

function productsSubmenuLabels(dataset: MockDataset): string[] {
  return map(
    pillarSubmenuItems(dataset, {
      pillar: "products",
      groupSlug: "products"
    }),
    item => item.label
  );
}

function placeOrderItem(dataset: MockDataset): MenuItem | undefined {
  return find(pillarNavItems(dataset), item =>
    /place new order/i.test(item.label)
  );
}

describe("BRAND_GATE_CONFIG_KEY — the gates name real platform keys", () => {
  it("maps every gate it claims to a member of BrandConfigKeys or OrgFeatureKeys", () => {
    const unrecognised = values(BRAND_GATE_CONFIG_KEY).filter(
      key => !includes(PLATFORM_KEYS, key)
    );

    expect(unrecognised).toEqual([]);
    expect(values(BRAND_GATE_CONFIG_KEY).length).toBeGreaterThan(0);
  });

  it("maps every gate that HAS a platform key, and records the ones that do not", () => {
    const mapped = keys(BRAND_GATE_CONFIG_KEY);
    // Read off a dataset carrying every OPTIONAL gate too — the shipped seed
    // omits `customStorefrontUrl`, and an absent key proves nothing.
    const everyGate = keys(
      withFeatures({ customStorefrontUrl: STOREFRONT_URL }).features
    );
    const unmapped = everyGate.filter(gate => !includes(mapped, gate));

    expect(unmapped.sort()).toEqual([...UNMAPPED_GATES].sort());
    expect(mapped.length).toBe(everyGate.length - UNMAPPED_GATES.length);
  });

  it("reads UPMIND_BRANDING_ENABLED through the INVERTED org key — the platform asks whether branding is removed", () => {
    expect(BRAND_GATE_CONFIG_KEY.UPMIND_BRANDING_ENABLED).toBe(
      OrgFeatureKeys.REMOVE_UPMIND_BRANDING_ENABLED
    );
    // The inversion is the whole point: a brand-level "branding enabled" key
    // would read the opposite sense off the same flag.
    expect(
      includes(
        values(OrgFeatureKeys),
        BRAND_GATE_CONFIG_KEY.UPMIND_BRANDING_ENABLED
      )
    ).toBe(true);
    expect(
      includes(
        values(BrandConfigKeys),
        BRAND_GATE_CONFIG_KEY.UPMIND_BRANDING_ENABLED
      )
    ).toBe(false);
  });

  it("routes support and the store through their own distinct platform keys", () => {
    expect(BRAND_GATE_CONFIG_KEY.DISABLE_SUPPORT_SYSTEM).toBe(
      BrandConfigKeys.UI_CLIENT_APP_DISABLE_SUPPORT_SYSTEM
    );
    expect(BRAND_GATE_CONFIG_KEY.showStore).toBe(
      BrandConfigKeys.SHOW_CLIENT_STORE
    );
    expect(BRAND_GATE_CONFIG_KEY.CLIENT_NOTES_AND_SECRETS_ENABLED).toBe(
      BrandConfigKeys.CLIENT_NOTES_AND_SECRETS_ENABLED
    );
    expect(BRAND_GATE_CONFIG_KEY.SUPPORT_PIN_ENABLED).toBe(
      BrandConfigKeys.SUPPORT_PIN_ENABLED
    );
    expect(BRAND_GATE_CONFIG_KEY.UPMIND_AFFILIATES_ENABLED).toBe(
      BrandConfigKeys.UPMIND_AFFILIATES_ENABLED
    );
  });
});

describe("primary nav — legacy's if: predicates, as data over the gates", () => {
  it("carries all six destinations when every gate is on", () => {
    expect(navLabels(HOSTGRID_MOCK_DATASET)).toEqual([
      "Dashboard",
      "Products & Services",
      // The brand's own menu page, injected where legacy injected it.
      "Getting started",
      "Billing",
      "My Account",
      "Support",
      "Place New Order"
    ]);
  });

  it("drops Support and Place New Order on the gates-off dataset, keeping the ungated four", () => {
    const minimal = navLabels(HOSTGRID_MINIMAL_MOCK_DATASET);

    expect(minimal).not.toContain("Support");
    expect(minimal).not.toContain("Place New Order");
    expect(minimal).toEqual([
      "Dashboard",
      "Products & Services",
      "Billing",
      "My Account"
    ]);
  });

  it("sends Place New Order OUT of the portal when the brand sets its own storefront URL", () => {
    const own = placeOrderItem(withFeatures({ showStore: true }));
    const external = placeOrderItem(
      withFeatures({ showStore: true, customStorefrontUrl: STOREFRONT_URL })
    );

    expect(own?.to).toBeDefined();
    expect(own?.href).toBeUndefined();
    expect(external?.href).toBe(STOREFRONT_URL);
    expect(external?.to).toBeUndefined();
  });
});

describe("products submenu — hideOneTimePurchases", () => {
  it("removes the one-time scope, and keeps every other scope, when the gate is on", () => {
    const shown = productsSubmenuLabels(
      withFeatures({ hideOneTimePurchases: false })
    );
    const hidden = productsSubmenuLabels(
      withFeatures({ hideOneTimePurchases: true })
    );

    expect(shown).toContain("One-time purchases");
    expect(hidden).not.toContain("One-time purchases");
    expect(hidden).toContain("Subscriptions");
    expect(hidden).toContain("All products and services");
  });
});

describe("account section — notes, affiliate and the support PIN", () => {
  it("gates Notes and Affiliate out of the section nav on the minimal dataset", () => {
    const enabled = map(
      accountSectionNavItems(HOSTGRID_MOCK_DATASET),
      item => item.label
    );
    const gatedOff = map(
      accountSectionNavItems(HOSTGRID_MINIMAL_MOCK_DATASET),
      item => item.label
    );

    expect(enabled.some(label => /notes/i.test(label))).toBe(true);
    expect(enabled.some(label => /affiliate/i.test(label))).toBe(true);
    expect(gatedOff.some(label => /notes/i.test(label))).toBe(false);
    expect(gatedOff.some(label => /affiliate/i.test(label))).toBe(false);
    // The ungated rows survive, so an empty list cannot pass this.
    expect(gatedOff.some(label => /profile/i.test(label))).toBe(true);
    expect(gatedOff.some(label => /security/i.test(label))).toBe(true);
  });

  // The panel masks the number until the client asks for it, so the VALUE is
  // read in `account-card.test.ts`, which drives the reveal. The gate is here.
  it("shows the support PIN panel only where SUPPORT_PIN_ENABLED is on", () => {
    const enabled = supportPinPanelItems(HOSTGRID_MOCK_DATASET);
    const gatedOff = supportPinPanelItems(HOSTGRID_MINIMAL_MOCK_DATASET);

    expect(enabled.length).toBe(1);
    expect(enabled[0]?.value).not.toBe(
      HOSTGRID_MOCK_DATASET.persona.supportPin
    );
    expect(gatedOff).toEqual([]);
  });
});
