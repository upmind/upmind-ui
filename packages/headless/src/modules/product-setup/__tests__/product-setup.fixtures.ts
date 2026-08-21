// -----------------------------------------------------------------------------
/**
 * @fileoverview product-setup Fixture Generator — headless Playwright (ADR 025
 * §A1.3 / FE-2937 mode (b); FE-2796's first customer).
 *
 * ## Job To Be Done
 * Drive a REAL guest storefront flow on staging in a headless chromium session
 * and capture, through the real recording pipeline (`playwright-recorder.mjs` →
 * `fixture-naming.mjs`), the traffic `useProductSetup` needs to be driven at the
 * integration layer: a guest basket holding an INVALID / configurable product
 * (validation errors + provisionFields + service_identifier) plus its boot.
 *
 * The basket is seeded with TWO distinct fully-invalid configurable domains
 * (`.au` + `.org`) added with NO provision config, so:
 *   - the `PATCH …/provision_fields/values/check` returns a 409 whose per-field
 *     errors become the basket's `basketErrors` (the source `useProductSetup`'s
 *     schema is derived from), and
 *   - `basketProducts` carries two products that require setup — enough to drive
 *     `getNextInvalid`, the `apply()`/`updateMany` merge contract, and the
 *     `configure()`/`reset()` lifecycle. (The cross-product `getNextRelated`
 *     routing needs a non-null `service_identifier` cross-reference that a
 *     freshly-invalid domain does not carry — see the int test's BLOCKED tags.)
 *
 * ## Why this is not a normal test
 * It launches chromium and makes REAL calls against `VITE_API_URL` (creating a
 * real staging order — sanctioned), so it is EXCLUDED from the normal suites by
 * the `*.fixtures.ts` suffix and run only on demand:
 *
 *   pnpm fixtures:generate product-setup
 *
 * It has no assertions beyond "the capture happened and the basket was invalid".
 */

import { join } from "node:path";
import { chromium } from "@playwright/test";
import { describe, it, expect } from "vitest";
import { attachRecorder } from "@upmind-automation/test-fixtures/playwright-recorder";

// -----------------------------------------------------------------------------

const API_URL = process.env.VITE_API_URL
  ? process.env.VITE_API_URL.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "VITE_API_URL is required to generate fixtures (e.g. set it in " +
          "packages/headless/.env.recording). Refusing to run against an unknown API."
      );
    })();

const ORIGIN = process.env.RECORDING_BRAND_ORIGIN
  ? process.env.RECORDING_BRAND_ORIGIN.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "RECORDING_BRAND_ORIGIN is required (e.g. set it in .env.recording). " +
          "The API resolves the brand from the Origin header."
      );
    })();

const recordingsDir = join(import.meta.dirname, "fixtures");

// Two distinct configurable domains (support/constants/products.ts): each needs
// registrant provision fields, so added bare they come back invalid.
const DOMAIN_AU = "4d036794-24d0-e710-488b-3153698d582e"; // .au Domain
const DOMAIN_ORG = "5d085e69-d562-3719-459a-218e940d4237"; // .org Domain
// A hosting product carrying a single `domain` provision field of type `order`
// — the cross-reference seam: set to an in-basket domain's `service_identifier`
// and the hosting product's provisionFields point at that domain.
const STARTER_HOSTING = "3de78642-de53-9714-76df-21208469530d";
const CURRENCY = "GBP";

// The two SLDs the configured-basket flow seats. Setting a domain's `sld`
// provision field is enough for the API to derive its `service_identifier`
// (`<sld>.<tld>`) — no registrant needed — so each domain gets a NON-NULL,
// distinct service_identifier while still failing the provision check on its
// (empty) registrant fields. That is exactly the shape the routing / similar /
// reset todos need and a freshly-bare domain cannot provide.
const SLD_A = "fixturegenalpha"; // → fixturegenalpha.au on DOMAIN_AU
const SLD_B = "fixturegenbeta"; // → fixturegenbeta.org on DOMAIN_ORG

// Config-value keys the real `useConfig`/`useBrand` boot requests (copied from
// the pilot journey's captured paths). `keys` is identity-bearing, but this unit
// captures each config endpoint once, so its single fixture always serves.
const BRAND_VALUE_KEYS = [
  "ui.basket.default_currency",
  "ui.basket.add_to_basket_funnelling",
  "ui.checkout.checkout_flow",
  "ui.checkout.hide_promotions_field",
  "invoices.common.require_address_for_orders",
  "invoices.common.require_company_for_orders",
  "invoices.common.required_region_in_address",
  "provisioning.domain_names.search_method",
  "ui.client_area.show_catalog"
].join(",");

const ORG_VALUE_KEYS = [
  "package.enabled_features.product_provisioning",
  "package.enabled_features.unlimited_provisioning_configurations"
].join(",");

// The full product expansion the basket machine asks `orders/current` for
// (identity-excluded, but requested so the captured products parse fully).
const ORDER_WITH = [
  "address",
  "currency",
  "promotions",
  "taxes",
  "client",
  "products.product.image",
  "products.product.prices",
  "products.product.products_attributes",
  "products.product.products_options",
  "products.product.products_options.prices",
  "products.product.provision_blueprint.category",
  "products.product.provision_field_values",
  "products.product.category"
].join(",");

const PRODUCT_WITH = [
  "image",
  "images",
  "prices",
  "products_attributes",
  "products_options",
  "products_options.prices",
  "provision_blueprint.category"
].join(",");

// -----------------------------------------------------------------------------

describe("product-setup fixtures generator (headless Playwright)", () => {
  it("captures a guest boot + two-invalid-domain basket against staging", async () => {
    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox"]
    });

    try {
      const context = await browser.newContext();
      const recorder = await attachRecorder(context, {
        recordingsDir,
        origin: ORIGIN,
        source: "journey",
        name: "product-setup-invalid-basket"
      });

      const page = await context.newPage();
      await page.goto("about:blank");

      const result = await page.evaluate(
        async args => {
          const {
            API,
            DOMAIN_AU,
            DOMAIN_ORG,
            CURRENCY,
            BRAND_VALUE_KEYS,
            ORG_VALUE_KEYS,
            ORDER_WITH,
            PRODUCT_WITH
          } = args;

          const json = async (res: Response) => {
            const text = await res.text();
            try {
              return { status: res.status, body: JSON.parse(text) };
            } catch {
              return { status: res.status, body: null };
            }
          };

          let token = "";
          const authed = () => ({
            "Content-Type": "application/json",
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          });
          const get = (path: string) =>
            fetch(`${API}${path}`, { headers: authed() }).then(json);
          const post = (path: string, body: unknown) =>
            fetch(`${API}${path}`, {
              method: "POST",
              headers: authed(),
              body: JSON.stringify(body)
            }).then(json);
          const patch = (path: string) =>
            fetch(`${API}${path}`, { method: "PATCH", headers: authed() }).then(
              json
            );

          // --- 1) guest session ------------------------------------------------
          const tokenRes = await fetch(`${API}/oauth/access_token?lang=en`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Accept: "application/json"
            },
            body: new URLSearchParams({ grant_type: "guest" }).toString()
          }).then(json);
          token =
            (tokenRes.body as any)?.access_token ??
            (tokenRes.body as any)?.data?.access_token ??
            "";

          // --- 2) brand / config / boot lookups --------------------------------
          // Independent of one another — fire together; each is still captured.
          await Promise.all([
            get(`/api/self?with=actor,accounts&lang=en`),
            get(`/api/brand/settings?lang=en-US`),
            get(`/api/config/brand/values?keys=${BRAND_VALUE_KEYS}`),
            get(`/api/config/organisation/values?keys=${ORG_VALUE_KEYS}`),
            get(`/api/org/modules`),
            get(`/api/countries?limit=0&order=name&lang=en-US`),
            get(`/api/billing_cycles?limit=0&lang=en-US`),
            get(`/api/basket_fields?lang=en-US`)
          ]);

          // --- 3) create the invalid basket (two bare configurable domains) ----
          const created = await post(`/api/orders?lang=en-US`, {
            category_slug: "new_contract",
            currency_code: CURRENCY,
            products: [
              { product_id: DOMAIN_AU, quantity: 1, billing_cycle_months: 12 },
              { product_id: DOMAIN_ORG, quantity: 1, billing_cycle_months: 12 }
            ]
          });
          const basket = (created.body as any)?.data;
          const basketId = basket?.id;
          const products = (basket?.products ?? []) as any[];

          // --- 4) the invalid-basket traffic the machines replay ---------------
          const current = await get(
            `/api/orders/current?with=${ORDER_WITH}&lang=en-US`
          );
          const check = await patch(
            `/api/orders/${basketId}/provision_fields/values/check`
          );

          // Independent across products and within each product — fire together;
          // fixture filenames are deterministic per identity, so capture order
          // does not matter.
          await Promise.all(
            products.flatMap(p => [
              get(
                `/api/orders/${basketId}/products/${p.id}/provision_fields/values`
              ),
              // config-machine hydration (product + blueprint, field defs)
              get(
                `/api/basket/${basketId}/products/${p.id}?with=${PRODUCT_WITH}&basket_id=${basketId}&basket_product_id=${p.id}&currency_code=${CURRENCY}`
              ),
              get(`/api/basket/products/${p.product_id}/provision_fields`)
            ])
          );

          return {
            tokenStatus: tokenRes.status,
            actor: (tokenRes.body as any)?.actor_type,
            createStatus: created.status,
            basketId,
            productCount: products.length,
            productIds: products.map(p => ({
              bpid: p.id,
              productId: p.product_id,
              service: p.service_identifier
            })),
            currentStatus: current.status,
            currentProductCount: ((current.body as any)?.data?.products ?? [])
              .length,
            checkStatus: check.status
          };
        },
        {
          API: API_URL,
          DOMAIN_AU,
          DOMAIN_ORG,
          CURRENCY,
          BRAND_VALUE_KEYS,
          ORG_VALUE_KEYS,
          ORDER_WITH,
          PRODUCT_WITH
        }
      );

      console.log(
        "[product-setup.fixtures] flow:",
        JSON.stringify(result, null, 2)
      );

      // The capture is only useful if the basket really came back invalid.
      expect(result.actor).toBe("guest");
      expect(result.basketId, "a basket was created").toBeTruthy();
      expect(result.productCount, "two products seated").toBe(2);
      expect(
        result.checkStatus,
        "provision check rejected the bare basket"
      ).toBe(409);
      expect(
        recorder.count(),
        "captured at least the boot + invalid basket"
      ).toBeGreaterThan(8);
    } finally {
      await browser.close();
    }
  }, 120000);

  it("captures a configured cross-referenced basket (sld + hosting domain reference) against staging", async () => {
    // --- setup (NOT recorded) --------------------------------------------------
    // Mint a guest session and seat a basket with two configurable domains + a
    // hosting product, THEN configure each domain with only an `sld` (enough for
    // the API to derive a non-null `service_identifier` while the empty
    // registrant fields keep it invalid) and point the hosting product's
    // `domain` field at DOMAIN_ORG's derived service_identifier. All of this runs
    // over plain node fetch OUTSIDE the recorder, so the base capture's
    // create/put fixtures are never re-recorded or clobbered — only the
    // `case=`-tagged READS in the recorded phase below become fixtures.
    const headers = (bearer?: string) => ({
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: ORIGIN,
      Referer: `${ORIGIN}/`,
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {})
    });
    const jsonOf = async (res: Response): Promise<any> => {
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    };

    const tokenBody = await fetch(`${API_URL}/oauth/access_token?lang=en`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        Origin: ORIGIN
      },
      body: new URLSearchParams({ grant_type: "guest" }).toString()
    }).then(jsonOf);
    const token: string =
      tokenBody?.access_token ?? tokenBody?.data?.access_token ?? "";
    expect(token, "guest token minted for setup").toBeTruthy();

    const created = await fetch(`${API_URL}/api/orders?lang=en-US`, {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({
        category_slug: "new_contract",
        currency_code: CURRENCY,
        products: [
          { product_id: DOMAIN_AU, quantity: 1, billing_cycle_months: 12 },
          { product_id: DOMAIN_ORG, quantity: 1, billing_cycle_months: 12 },
          { product_id: STARTER_HOSTING, quantity: 1, billing_cycle_months: 24 }
        ]
      })
    }).then(jsonOf);
    const basketId: string = created?.data?.id;
    const seated: any[] = created?.data?.products ?? [];
    const domainABp = seated.find(p => p.product_id === DOMAIN_AU);
    const domainBBp = seated.find(p => p.product_id === DOMAIN_ORG);
    const hostingBp = seated.find(p => p.product_id === STARTER_HOSTING);
    expect(basketId, "configured basket created").toBeTruthy();
    expect(
      Boolean(domainABp && domainBBp && hostingBp),
      "domain + domain + hosting all seated"
    ).toBe(true);

    const putProduct = (bpid: string, body: unknown) =>
      fetch(`${API_URL}/api/orders/${basketId}/products/${bpid}?lang=en-US`, {
        method: "PUT",
        headers: headers(token),
        body: JSON.stringify(body)
      }).then(jsonOf);

    // sld ONLY → service_identifier derived; registrant left empty → invalid.
    await putProduct(domainABp.id, {
      product_id: DOMAIN_AU,
      quantity: 1,
      billing_cycle_months: 12,
      provision_field_values: { sld: SLD_A },
      provision_field_values_validate: false
    });
    await putProduct(domainBBp.id, {
      product_id: DOMAIN_ORG,
      quantity: 1,
      billing_cycle_months: 12,
      provision_field_values: { sld: SLD_B },
      provision_field_values_validate: false
    });

    // Read back DOMAIN_ORG's derived service_identifier and aim the hosting
    // product's `domain` field at it — the cross-reference the routing todos need.
    const afterSld = await fetch(
      `${API_URL}/api/orders/current?with=products&lang=en-US`,
      { headers: headers(token) }
    ).then(jsonOf);
    const domainBService: string | undefined = (
      afterSld?.data?.products ?? []
    ).find((p: any) => p.product_id === DOMAIN_ORG)?.service_identifier;
    expect(
      domainBService,
      "DOMAIN_ORG derived a non-null service_identifier from its sld"
    ).toBeTruthy();

    await putProduct(hostingBp.id, {
      product_id: STARTER_HOSTING,
      quantity: 1,
      billing_cycle_months: 24,
      provision_field_values: { domain: domainBService },
      provision_field_values_validate: false
    });

    // --- capture (recorded) ----------------------------------------------------
    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox"]
    });

    try {
      const context = await browser.newContext();
      const recorder = await attachRecorder(context, {
        recordingsDir,
        origin: ORIGIN,
        source: "journey",
        name: "product-setup-configured-basket"
      });

      const page = await context.newPage();
      await page.goto("about:blank");

      const result = await page.evaluate(
        async args => {
          const {
            API,
            TOKEN,
            BASKET_ID,
            IDS,
            HOSTING_PRODUCT_ID,
            ORDER_WITH,
            PRODUCT_WITH,
            CURRENCY
          } = args;

          const authed = {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${TOKEN}`
          };
          const json = async (res: Response) => {
            const text = await res.text();
            try {
              return { status: res.status, body: JSON.parse(text) };
            } catch {
              return { status: res.status, body: null };
            }
          };
          const get = (path: string) =>
            fetch(`${API}${path}`, { headers: authed }).then(json);
          const patch = (path: string) =>
            fetch(`${API}${path}`, { method: "PATCH", headers: authed }).then(
              json
            );

          // The rich basket the machines replay. `case=related` (ignored by the
          // API) keeps this on its own fixture identity, distinct from the base
          // two-bare-domain `orders/current`.
          const current = await get(
            `/api/orders/current?case=related&with=${ORDER_WITH}&lang=en-US`
          );
          // The provision check now rejects ONLY the empty registrant fields
          // (each domain's sld is set), keyed by basket-product index.
          const check = await patch(
            `/api/orders/${BASKET_ID}/provision_fields/values/check?case=related`
          );

          // Per-product provision-field VALUES — each product's model
          // provisionFields. The hosting product's carries the `domain`
          // cross-reference; the two domains' carry their slds.
          await get(
            `/api/orders/${BASKET_ID}/products/${IDS.a}/provision_fields/values?case=related-a`
          );
          await get(
            `/api/orders/${BASKET_ID}/products/${IDS.b}/provision_fields/values?case=related-b`
          );
          await get(
            `/api/orders/${BASKET_ID}/products/${IDS.h}/provision_fields/values?case=related-host`
          );

          // Hosting product config + its own field defs, so a routing test can
          // configure() the hosting product against ITS blueprint instead of the
          // collapsed domain one.
          await get(
            `/api/basket/${BASKET_ID}/products/${IDS.h}?case=related-host&with=${PRODUCT_WITH}&basket_id=${BASKET_ID}&basket_product_id=${IDS.h}&currency_code=${CURRENCY}`
          );
          await get(
            `/api/basket/products/${HOSTING_PRODUCT_ID}/provision_fields?case=related-host`
          );

          return {
            currentStatus: current.status,
            checkStatus: check.status,
            products: ((current.body as any)?.data?.products ?? []).map(
              (p: any) => ({
                id: p.id,
                productId: p.product_id,
                service: p.service_identifier
              })
            )
          };
        },
        {
          API: API_URL,
          TOKEN: token,
          BASKET_ID: basketId,
          IDS: { a: domainABp.id, b: domainBBp.id, h: hostingBp.id },
          HOSTING_PRODUCT_ID: STARTER_HOSTING,
          ORDER_WITH,
          PRODUCT_WITH,
          CURRENCY
        }
      );

      console.log(
        "[product-setup.fixtures] configured flow:",
        JSON.stringify({ ...result, domainBService }, null, 2)
      );

      // The capture is only useful if the cross-reference really landed.
      expect(result.currentStatus, "rich basket read back").toBe(200);
      expect(
        result.checkStatus,
        "registrant fields still reject the configured basket"
      ).toBe(409);

      const services = result.products.map(p => p.service);
      const nonNull = services.filter(Boolean);
      expect(
        nonNull.length,
        "every product carries a non-null service_identifier"
      ).toBe(result.products.length);
      expect(
        new Set(nonNull).size,
        "the two domains carry DISTINCT service_identifiers"
      ).toBeGreaterThanOrEqual(2);

      const hostProduct = result.products.find(
        p => p.productId === STARTER_HOSTING
      );
      expect(
        hostProduct?.service,
        "hosting product references DOMAIN_ORG's service_identifier"
      ).toBe(domainBService);

      expect(
        recorder.count(),
        "captured the rich basket + check + per-product reads"
      ).toBeGreaterThanOrEqual(7);
    } finally {
      await browser.close();
    }
  }, 120000);
});
