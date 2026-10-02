// -----------------------------------------------------------------------------
/**
 * @fileoverview Contract-Product API Fixtures Generator (ADR 035 Am.1, FE-3145)
 *
 * ## Job To Be Done
 * One recording per DRIVEN `contract-product.feature` scenario — one step folder
 * per step, named from the feature by `recordedStepDir`, replayed by
 * `contract-product.replay.int.test.ts` against the real `useContractProducts`
 * (collection) and `useContractProduct` (manager). Run on demand:
 *
 *   pnpm fixtures:generate contract-product
 *   pnpm fixtures:generate contract-product --scenario "<expanded title>"
 *
 * ## Why this is not a normal test
 * It makes REAL `fetch` calls against `VITE_API_URL` and needs staging
 * credentials — excluded from the normal suites by the `*.fixtures.ts` suffix.
 * A scenario arranges the staging data its steps need and leaves staging as it
 * found it (renewal stops resumed, schedules revoked, requests withdrawn).
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, beforeAll, afterAll } from "vitest";
import { API_CREDENTIALS } from "@upmind-automation/test-fixtures/credentials";
import { Generator } from "@upmind-automation/test-fixtures/generator";
import {
  GrantTypes,
  OrderTypes,
  PaymentType,
  TrialEndActionTypes,
  UserMetaKeys
} from "@upmind-automation/types";
import {
  prepareScenarioDirs,
  recordedStepDir
} from "../../../testing/scenario-fixtures";
// eslint-disable-next-line @internal/no-cross-module-imports -- token minting is auth-domain and auth owns the only copy; this is the recording lane, not the runtime module graph the Visibility Law protects.
import {
  mintClientToken,
  mintOtherClientToken,
  mintStaffToken,
  mintToken
} from "../../auth/__tests__/auth.tokens";
import { filter, find, isEmpty, keys } from "lodash-es";
import type { IToken } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const API_URL = process.env.VITE_API_URL
  ? process.env.VITE_API_URL.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "VITE_API_URL is required to generate fixtures (e.g. set it in .env.recording)."
      );
    })();

const ORIGIN = process.env.RECORDING_BRAND_ORIGIN
  ? process.env.RECORDING_BRAND_ORIGIN.replace(/\/$/, "")
  : (() => {
      throw new Error(
        "RECORDING_BRAND_ORIGIN is required to generate fixtures (e.g. set it in .env.recording)."
      );
    })();

const featureText = readFileSync(
  join(import.meta.dirname, "contract-product.feature"),
  "utf-8"
);

/** The 13 `with` members of the client products-list read (`design ✅.md` §8.1). */
const LIST_WITH = [
  "clients",
  "clients.image",
  "clients.brand",
  "status",
  "product.image",
  "brand.currency",
  "product.provision_blueprint",
  "product.provision_blueprint.category",
  "contract_request",
  "future_cancellation_request",
  "moved_to_contract_product",
  "moved_to_contract_product.clients",
  "tags"
].join(",");

/** The 36 `with` members of the client product detail read (`design ✅.md` §8.1). */
const PRODUCT_WITH = [
  "contract",
  "contract.account",
  "contract.address",
  "contract.brand.currency",
  "contract.cancellation_request.status",
  "contract.cancellation_request.custom_fields.field",
  "contract.client",
  "contract.client.tags",
  "contract.client.image",
  "contract.gateway",
  "contract.import.credentials",
  "contract.import.source",
  "contract.moved_to_contract",
  "contract.moved_to_contract.products",
  "contract.payment_details",
  "contract.payment_details.gateway",
  "contract.promotions",
  "contract.status",
  "allowed_migrations",
  "attributes.product.image",
  "brand",
  "contract_request",
  "contract_request.custom_fields.field",
  "future_cancellation_request",
  "options.product.image",
  "product",
  "product.brand.currency",
  "product.image",
  "product.images",
  "product.provision_blueprint",
  "product.provision_blueprint.category",
  "product.provision_category",
  "scheduled_actions",
  "status",
  "tags",
  "unpaid_recurring_invoices"
].join(",");

/** The 9 `with` members of the grouped-counts read (`design ✅.md` §8.1). */
const GROUPED_WITH = [
  "status",
  "product.image",
  "brand.currency",
  "product.provision_blueprint",
  "contract_request",
  "future_cancellation_request",
  "moved_to_contract_product",
  "moved_to_contract_product.clients",
  "tags"
].join(",");

type WireProduct = {
  id: string;
  contract_id: string;
  billing_cycle_months: number;
  renew: boolean;
  invoice_consolidation_enabled: number;
  status?: { code: string };
  contract_request?: unknown;
};

// -----------------------------------------------------------------------------

/** Plain, UNCAPTURED authed call — id lookup and staging restore. */
async function control(
  method: string,
  path: string,
  accessToken: string,
  body?: unknown
): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: ORIGIN,
      Authorization: `Bearer ${accessToken}`
    },
    body: body == null ? undefined : JSON.stringify(body)
  });
  return {
    status: response.status,
    body: await response.json().catch(() => null)
  };
}

// -----------------------------------------------------------------------------

describe("Contract-Product scenario recordings", () => {
  let clientToken: IToken;
  let clientId: string;
  let contractId: string;
  let productId: string;
  let currentConsolidation: number;
  let renewalOffProductId: string;
  const prepared = new Set<string>();

  async function recordStep(
    scenario: string,
    step: string,
    requests: (generator: Generator) => Promise<unknown>
  ): Promise<void> {
    if (!prepared.has(scenario)) {
      prepareScenarioDirs(import.meta.dirname, featureText, scenario);
      prepared.add(scenario);
    }
    const generator = new Generator(API_URL, {
      recordingsDir: recordedStepDir(
        import.meta.dirname,
        featureText,
        scenario,
        step
      ),
      origin: ORIGIN,
      source: "case",
      name: "contract-product"
    });
    generator.setBearerToken(clientToken.access_token);
    await requests(generator);
    generator.save();
  }

  const readList = async (generator: Generator) => {
    // The paged read and the total-count read the collection pairs; `limit=count`
    // is the count read's identity.
    await generator.get(
      `/api/contracts_products?with=${LIST_WITH}&split_count=1&exclude_delegated=1&skip_count=1&order=created_at&limit=10&offset=0`
    );
    await generator.get(
      `/api/contracts_products?with=${LIST_WITH}&split_count=1&exclude_delegated=1&skip_count=1&limit=count&order=created_at`
    );
  };

  /** The delegated-preference read the collection boot makes (resolveExcludeDelegated). */
  const readPreference = async (generator: Generator) => {
    await generator.get(
      `/api/clients/${clientId}?with=custom_fields,custom_fields.field`
    );
    await generator.get(
      "/api/custom_fields?filter[object_type]=client&order=order&limit=0&offset=0"
    );
  };

  /** The collection's whole boot: the preference reads, then the list read. */
  const readCollectionBoot = async (generator: Generator) => {
    await readPreference(generator);
    await readList(generator);
  };

  const readProduct = (generator: Generator) =>
    generator.get(`/api/contract_products/${productId}?with=${PRODUCT_WITH}`);

  /** The purchased-categories read (AC-20, ruling R10). */
  const readCategories = (generator: Generator) =>
    generator.get("/api/contract_product_categories?exclude_delegated=1");

  /** The dashboard grouped-counts read (AC-19) — the rows ride `total`. */
  const readGroupedCounts = (generator: Generator, filters = "") =>
    generator.get(
      `/api/clients/${clientId}/contracts/products?limit=count` +
        "&group_count=products.category_id,service_identifier" +
        "&order=service_identifier&filter[status.code]=contract_active" +
        `${filters}&with=${GROUPED_WITH}`
    );

  /** The manager boot: the product detail read plus its CANCEL_REQUEST catalogue. */
  const readManagerBoot = async (generator: Generator) => {
    await readProduct(generator);
    await generator.get(
      "/api/custom_fields?filter[object_type]=contract_request&order=order&limit=0&offset=0"
    );
  };

  const noRequest = () => Promise.resolve();

  beforeAll(async () => {
    clientToken = await mintClientToken();

    const selfResp = await control(
      "GET",
      "/api/self",
      clientToken.access_token
    );
    const selfData = (
      selfResp.body as { data?: { actor?: { id?: string }; actor_id?: string } }
    )?.data;
    clientId = selfData?.actor?.id ?? selfData?.actor_id ?? "";
    if (!clientId)
      throw new Error("Could not resolve the client id from /api/self.");

    const productsResp = await control(
      "GET",
      "/api/contracts_products?with=status,contract_request&filter[status.code]=contract_active&limit=50",
      clientToken.access_token
    );
    const products = ((productsResp.body as { data?: WireProduct[] })?.data ??
      []) as WireProduct[];
    const subscription = products.find(
      product =>
        product.billing_cycle_months > 0 &&
        product.renew &&
        !product.contract_request
    );
    if (!subscription)
      throw new Error(
        "No clean active, renewing subscription on the staging client."
      );
    productId = subscription.id;
    contractId = subscription.contract_id;
    currentConsolidation = subscription.invoice_consolidation_enabled;

    // A product whose renewal invoicing is switched off (AC-21 "off" row).
    const offResp = await control(
      "GET",
      "/api/contracts_products?with=status&filter[auto_create_renew_invoice]=0&limit=5",
      clientToken.access_token
    );
    const offRows = ((offResp.body as { data?: { id: string }[] })?.data ??
      []) as { id: string }[];
    renewalOffProductId = offRows[0]?.id ?? "";
    if (!renewalOffProductId)
      throw new Error(
        "No product with renewal invoicing off on the staging client."
      );
  }, 60000);

  // === AC-1 · THE COLLECTION ================================================

  describe("See the products on my own account", () => {
    const s = "See the products on my own account";
    it("I am an authenticated client acting on my own account, unless a scenario says otherwise", () =>
      recordStep(
        s,
        "I am an authenticated client acting on my own account, unless a scenario says otherwise",
        noRequest
      ));
    it("I open my products", () =>
      recordStep(s, "I open my products", readCollectionBoot));
    it("I see the first page of my products, and it updates as my products change", () =>
      recordStep(
        s,
        "I see the first page of my products, and it updates as my products change",
        noRequest
      ));
    it("each one arrives with its status", () =>
      recordStep(s, "each one arrives with its status", noRequest));
    it("each one arrives with its catalogue product", () =>
      recordStep(s, "each one arrives with its catalogue product", noRequest));
    it("each one arrives with that product's brand", () =>
      recordStep(s, "each one arrives with that product's brand", noRequest));
    it("each one arrives with its category", () =>
      recordStep(s, "each one arrives with its category", noRequest));
    it("each one arrives with its tags", () =>
      recordStep(s, "each one arrives with its tags", noRequest));
    it("each one arrives with its pending contract request", () =>
      recordStep(
        s,
        "each one arrives with its pending contract request",
        noRequest
      ));
    it("each one arrives with any cancellation scheduled against it for a future date", () =>
      recordStep(
        s,
        "each one arrives with any cancellation scheduled against it for a future date",
        noRequest
      ));
    it("each one arrives with the product it was moved to", () =>
      recordStep(
        s,
        "each one arrives with the product it was moved to",
        noRequest
      ));
    it("no other client's products are ever loaded", () =>
      recordStep(s, "no other client's products are ever loaded", noRequest));
  });

  // === AC-1 · NARROW, CLEAR, ORDER, PAGE, TOGGLE ============================
  // The collection's criteria scenarios. A narrowing is proven on a product
  // ARRANGED for it — a fresh one-off Hat ordered pay-later, whose name,
  // category, status, purchase date and price the rows narrow by — and the
  // arranged order is cancelled by staff in `afterAll`. A recording whose
  // narrowed rows equal the unnarrowed first page proves nothing, so the
  // generator refuses to save one.

  const HAT = "47d73824-8507-9315-9e0b-81e642d59e06";
  const COLLECTION_BG =
    "I am an authenticated client acting on my own account, unless a scenario says otherwise";

  type ListRow = {
    id: string;
    created_at: string;
    total_amount: number;
    status?: { code: string };
    product?: {
      name: string;
      category_id: string;
      category?: { name: string };
    };
  };

  const listUrl = (params: string, paging = "&skip_count=1") =>
    `/api/contracts_products?with=${LIST_WITH}&split_count=1&exclude_delegated=1${paging}${params}`;

  /** The paged read and the total-count read the collection pairs for one criteria set. */
  const readCriteria = async (
    generator: Generator,
    { filters = "", order = "created_at", offset = 0 } = {}
  ) => {
    await generator.get(
      listUrl(`${filters}&order=${order}&limit=10&offset=${offset}`)
    );
    await generator.get(listUrl(`${filters}&limit=count&order=${order}`));
  };

  const rowsOf = async (path: string): Promise<ListRow[]> =>
    ((
      (await control("GET", path, clientToken.access_token)).body as {
        data?: ListRow[];
      }
    )?.data ?? []) as ListRow[];

  /** Orders one Hat pay-later and returns its invoice and its contract-product row. */
  async function arrangeHat(): Promise<{ invoiceId: string; row: ListRow }> {
    const hatsPath = `/api/contracts_products?with=status,product,product.category&filter[product_id]=${HAT}&limit=0`;
    const before = new Set((await rowsOf(hatsPath)).map(row => row.id));
    const order = await control(
      "POST",
      "/api/orders",
      clientToken.access_token,
      {
        category_slug: "new_contract",
        products: [{ product_id: HAT, quantity: 1, billing_cycle_months: 0 }]
      }
    );
    const basketId = (order.body as { data?: { id?: string } })?.data?.id;
    const convert = await control(
      "PATCH",
      `/api/orders/${basketId}/convert`,
      clientToken.access_token,
      { type: PaymentType.PAY_LATER, amount: 0 }
    );
    const invoiceId =
      (convert.body as { data?: { id?: string } })?.data?.id ?? "";
    const row = (await rowsOf(hatsPath)).find(hat => !before.has(hat.id));
    if (!invoiceId || !row)
      throw new Error(
        `Arranging a Hat failed: order ${order.status}, convert ${convert.status}.`
      );
    return { invoiceId, row };
  }

  async function cancelHatOrder(invoiceId: string | undefined): Promise<void> {
    if (!invoiceId) return;
    const { status } = await control(
      "PATCH",
      `/api/admin/orders/${invoiceId}/cancel`,
      (await mintStaffToken()).access_token,
      {}
    );
    if (status >= 400)
      throw new Error(`Cancelling the arranged Hat order answered ${status}.`);
  }

  const totalOf = async (filters: string): Promise<number> =>
    (
      (
        await control(
          "GET",
          listUrl(`${filters}&limit=count&order=created_at`),
          clientToken.access_token
        )
      ).body as { total: number }
    ).total;

  /** Refuses a narrowing that leaves my first page and my total as they were. */
  async function assertNarrows(filters: string): Promise<void> {
    const ids = (rows: ListRow[]) => rows.map(row => row.id).join();
    const all = await rowsOf(listUrl("&order=created_at&limit=10&offset=0"));
    const narrowed = await rowsOf(
      listUrl(`${filters}&order=created_at&limit=10&offset=0`)
    );
    if (
      !narrowed.length ||
      (ids(narrowed) === ids(all) &&
        (await totalOf(filters)) === (await totalOf("")))
    )
      throw new Error(`"${filters}" does not narrow my products.`);
  }

  describe("Narrow my products the way the product area lets me", () => {
    let invoiceId: string | undefined;
    let hat: ListRow;

    beforeAll(async () => {
      ({ invoiceId, row: hat } = await arrangeHat());
    }, 60000);
    afterAll(() => cancelHatOrder(invoiceId), 60000);

    const narrowings: [string, () => string][] = [
      [
        "a quick-search term",
        () => `&query=${encodeURIComponent(hat.product!.name)}`
      ],
      [
        "product name",
        () =>
          `&filter[product.name|like]=${encodeURIComponent(`%${hat.product!.name}%`)}`
      ],
      [
        "category name",
        () =>
          `&filter[product.category.name|like]=${encodeURIComponent(`%${hat.product!.category!.name}%`)}`
      ],
      [
        "category",
        () => `&filter[product.category.id]=${hat.product!.category_id}`
      ],
      ["lifecycle status", () => `&filter[status.code]=${hat.status!.code}`],
      [
        "when I bought them",
        () => `&filter[created_at|gt]=${hat.created_at.slice(0, 10)}`
      ],
      [
        "when they next fall due",
        () => `&filter[next_due_date|gt]=${hat.created_at.slice(0, 10)}`
      ],
      ["price", () => `&filter[total_amount]=${hat.total_amount}`]
    ];

    for (const [narrowing, filters] of narrowings) {
      const s = `Narrow my products the way the product area lets me — ${narrowing}`;
      const when = `I narrow my products by ${narrowing}`;
      describe(s, () => {
        it(COLLECTION_BG, () => recordStep(s, COLLECTION_BG, noRequest));
        it(when, async () => {
          await assertNarrows(filters());
          await recordStep(s, when, async generator => {
            await readCollectionBoot(generator);
            await readCriteria(generator, { filters: filters() });
          });
        });
        it("only the products matching what I asked for are returned", () =>
          recordStep(
            s,
            "only the products matching what I asked for are returned",
            noRequest
          ));
      });
    }
  });

  describe("Clearing what I asked for brings all my products back", () => {
    const s = "Clearing what I asked for brings all my products back";
    let invoiceId: string | undefined;
    let hat: ListRow;
    const byName = () =>
      `&filter[product.name|like]=${encodeURIComponent(`%${hat.product!.name}%`)}`;

    beforeAll(async () => {
      ({ invoiceId, row: hat } = await arrangeHat());
    }, 60000);
    afterAll(() => cancelHatOrder(invoiceId), 60000);

    it(COLLECTION_BG, () => recordStep(s, COLLECTION_BG, noRequest));
    it("I have narrowed my products", async () => {
      await assertNarrows(byName());
      await recordStep(s, "I have narrowed my products", async generator => {
        await readCollectionBoot(generator);
        await readCriteria(generator, { filters: byName() });
      });
    });
    it("I clear what I narrowed my products by", () =>
      recordStep(s, "I clear what I narrowed my products by", generator =>
        readCriteria(generator)
      ));
    for (const line of [
      "all my products come back",
      "the cleared key is not sent"
    ])
      it(line, () => recordStep(s, line, noRequest));
  });

  /** `-field` is a descending order on the wire. */
  for (const [ordering, order] of [
    ["status", "-status"],
    ["when I bought them", "-created_at"],
    ["when they next fall due", "-next_due_date"],
    ["when they were cancelled", "-cancelled_date"]
  ]) {
    const s = `Order my products — ${ordering}`;
    const when = `I order them by ${ordering}`;
    describe(s, () => {
      it(COLLECTION_BG, () => recordStep(s, COLLECTION_BG, noRequest));
      it("I have more products than fit on one page", () =>
        recordStep(
          s,
          "I have more products than fit on one page",
          readCollectionBoot
        ));
      it(when, async () => {
        const ids = (rows: ListRow[]) => rows.map(row => row.id).join();
        const byDefault = await rowsOf(
          listUrl("&order=created_at&limit=10&offset=0")
        );
        const ordered = await rowsOf(
          listUrl(`&order=${order}&limit=10&offset=0`)
        );
        if (ids(ordered) === ids(byDefault))
          throw new Error(`Ordering by ${order} does not reorder my products.`);
        await recordStep(s, when, generator =>
          readCriteria(generator, { order })
        );
      });
      it("my products come back in that order", () =>
        recordStep(s, "my products come back in that order", noRequest));
    });
  }

  /** The offset of the last page of my products, off the live count read. */
  const lastPageOffset = async (): Promise<number> => {
    const { total } = (
      await control(
        "GET",
        listUrl("&limit=count&order=created_at"),
        clientToken.access_token
      )
    ).body as { total: number };
    if (!(total > 10))
      throw new Error(`My products fit on one page (${total}).`);
    return Math.floor((total - 1) / 10) * 10;
  };

  for (const [move, start, onStart, onMove] of [
    [
      "forward to the next page",
      "first",
      noRequest,
      (generator: Generator) => readCriteria(generator, { offset: 10 })
    ],
    [
      "back to the previous page",
      "second",
      (generator: Generator) => readCriteria(generator, { offset: 10 }),
      (generator: Generator) => readCriteria(generator, { offset: 0 })
    ],
    [
      "forward to the last page",
      "first",
      noRequest,
      async (generator: Generator) =>
        readCriteria(generator, { offset: await lastPageOffset() })
    ]
  ] as const) {
    const s = `Move through the pages of my products — ${move}`;
    const outcome = {
      "forward to the next page": "the next page comes back",
      "back to the previous page": "the previous page comes back",
      "forward to the last page":
        "the last page comes back and I am told there is no further page to go to"
    }[move];
    describe(s, () => {
      it(COLLECTION_BG, () => recordStep(s, COLLECTION_BG, noRequest));
      it("I have more products than fit on one page", () =>
        recordStep(
          s,
          "I have more products than fit on one page",
          readCollectionBoot
        ));
      it(`I am on the ${start} page of them`, () =>
        recordStep(s, `I am on the ${start} page of them`, onStart));
      it(`I move ${move} of my products`, () =>
        recordStep(s, `I move ${move} of my products`, onMove));
      it(outcome, () => recordStep(s, outcome, noRequest));
    });
  }

  const TOGGLE = {
    All: "",
    Subscriptions: "&filter[billing_cycle_days|neq]=0",
    "One-time": "&filter[billing_cycle_days|eq]=0"
  } as const;

  describe("A subscription-type toggle shows all my products, only my subscriptions, or only my one-time purchases", () => {
    let invoiceId: string | undefined;

    beforeAll(async () => {
      ({ invoiceId } = await arrangeHat());
    }, 60000);
    afterAll(() => cancelHatOrder(invoiceId), 60000);

    for (const [position, from, outcome] of [
      [
        "All",
        "Subscriptions",
        "my products come back whether they are subscriptions or not"
      ],
      ["Subscriptions", "All", "only my subscriptions come back"],
      [
        "One-time",
        "Subscriptions",
        "only my one-time purchases come back, and the subscriptions narrowing no longer applies"
      ]
    ] as const) {
      const s = `A subscription-type toggle shows all my products, only my subscriptions, or only my one-time purchases — ${position}`;
      const given = `I am looking at my products with the subscription-type toggle at ${from}`;
      const when = `I set the subscription-type toggle to ${position}`;
      describe(s, () => {
        it(COLLECTION_BG, () => recordStep(s, COLLECTION_BG, noRequest));
        it(given, async () => {
          if (TOGGLE[from]) await assertNarrows(TOGGLE[from]);
          await recordStep(s, given, async generator => {
            await readCollectionBoot(generator);
            if (TOGGLE[from])
              await readCriteria(generator, { filters: TOGGLE[from] });
          });
        });
        it(when, async () => {
          if (TOGGLE[position]) await assertNarrows(TOGGLE[position]);
          await recordStep(s, when, generator =>
            readCriteria(generator, { filters: TOGGLE[position] })
          );
        });
        it(outcome, () => recordStep(s, outcome, noRequest));
      });
    }
  });

  // === AC-1 / AC-19 · A BRAND THAT HIDES ONE-OFF PURCHASES =================
  // Staff set the portal brand's `@context.oneTimePurchases` to "hidden" (legacy
  // `brand/hideOneTimePurchases`) for the scenario and put the brand's meta back
  // after it. The Background step records the portal brand read, so the seed
  // boots on the hiding brand. A recording taken while my account holds no
  // one-off purchase proves nothing, so the generator refuses one.

  const HIDE_ONE_OFFS = "&filter[billing_cycle_days|neq]=0";

  type BrandSettings = { id: string; meta: Record<string, unknown> | null };

  const brandSettings = async (): Promise<BrandSettings> =>
    (
      (await control("GET", "/api/brand/settings", clientToken.access_token))
        .body as { data: BrandSettings }
    ).data;

  async function putBrandMeta(
    brandId: string,
    meta: Record<string, unknown>
  ): Promise<void> {
    const { status, body } = await control(
      "PUT",
      `/api/admin/brands/${brandId}`,
      (await mintStaffToken()).access_token,
      { meta }
    );
    if (status >= 400)
      throw new Error(
        `Writing the brand meta answered ${status}: ${JSON.stringify(body).slice(0, 300)}`
      );
  }

  /** Hides one-off purchases on the portal brand for the enclosing describe, then restores it. */
  function withBrandHidingOneOffs(): void {
    let held: BrandSettings | undefined;

    beforeAll(async () => {
      if (!((await totalOf("&filter[billing_cycle_days|eq]=0")) > 0))
        throw new Error("My account holds no one-off purchase to hide.");
      held = await brandSettings();
      const meta = held.meta ?? {};
      const portal = (meta.portal ?? {}) as Record<string, unknown>;
      await putBrandMeta(held.id, {
        ...meta,
        portal: { ...portal, "@context.oneTimePurchases": "hidden" }
      });
      const hidden = (
        (await brandSettings()).meta?.portal as Record<string, unknown>
      )?.["@context.oneTimePurchases"];
      if (hidden !== "hidden")
        throw new Error(
          `The brand does not read one-off purchases as hidden (${String(hidden)}).`
        );
    }, 60000);

    afterAll(async () => {
      if (!held) return;
      await putBrandMeta(held.id, held.meta ?? {});
      const restored = (await brandSettings()).meta ?? {};
      if (JSON.stringify(restored) !== JSON.stringify(held.meta ?? {}))
        throw new Error(
          `Restoring the brand meta left ${JSON.stringify(restored).slice(0, 300)}.`
        );
    }, 60000);
  }

  const readBrand = async (generator: Generator) => {
    const { body } = await generator.get("/api/brand/settings");
    const hidden = ((
      body as { data?: { meta?: { portal?: Record<string, unknown> } } }
    )?.data?.meta?.portal ?? {})["@context.oneTimePurchases"];
    if (hidden !== "hidden")
      throw new Error("The recorded brand does not hide one-off purchases.");
  };

  /** The collection boot on a brand that hides one-off purchases. */
  const readHiddenCollectionBoot = async (generator: Generator) => {
    await readPreference(generator);
    await readCriteria(generator, { filters: HIDE_ONE_OFFS });
  };

  describe("A brand that hides one-off purchases hides them from me everywhere", () => {
    withBrandHidingOneOffs();

    for (const [narrowing, outcome] of [
      ["nothing", "only my subscriptions come back"],
      [
        "one-off purchases",
        "only my subscriptions come back — my brand's choice outranks mine"
      ]
    ] as const) {
      const s = `A brand that hides one-off purchases hides them from me everywhere — ${narrowing}`;
      describe(s, () => {
        it(COLLECTION_BG, () => recordStep(s, COLLECTION_BG, readBrand));
        it("my brand has chosen to hide one-off purchases from its portal", () =>
          recordStep(
            s,
            "my brand has chosen to hide one-off purchases from its portal",
            noRequest
          ));
        it(`I ask for ${narrowing}`, () =>
          recordStep(
            s,
            `I ask for ${narrowing}`,
            narrowing === "nothing" ? noRequest : readHiddenCollectionBoot
          ));
        it("I open my products", () =>
          recordStep(
            s,
            "I open my products",
            narrowing === "nothing" ? readHiddenCollectionBoot : noRequest
          ));
        it(outcome, () => recordStep(s, outcome, noRequest));
      });
    }
  });

  describe("A brand that hides one-off purchases hides them from my category counts too", () => {
    const s =
      "A brand that hides one-off purchases hides them from my category counts too";
    withBrandHidingOneOffs();

    it(COLLECTION_BG, () => recordStep(s, COLLECTION_BG, readBrand));
    it("my brand has chosen to hide one-off purchases from its portal", () =>
      recordStep(
        s,
        "my brand has chosen to hide one-off purchases from its portal",
        noRequest
      ));
    it("I ask for my products grouped by category", async () => {
      const groups = async (filters: string) =>
        JSON.stringify(
          (
            await control(
              "GET",
              `/api/clients/${clientId}/contracts/products?limit=count&group_count=products.category_id,service_identifier&order=service_identifier&filter[status.code]=contract_active${filters}`,
              clientToken.access_token
            )
          ).body
        );
      if ((await groups(HIDE_ONE_OFFS)) === (await groups("")))
        throw new Error("Hiding one-off purchases changes none of my counts.");
      await recordStep(
        s,
        "I ask for my products grouped by category",
        async generator => {
          await readHiddenCollectionBoot(generator);
          await readGroupedCounts(generator, HIDE_ONE_OFFS);
        }
      );
    });
    it("only my subscriptions are counted here too", () =>
      recordStep(s, "only my subscriptions are counted here too", noRequest));
  });

  // === MANAGER ARRANGEMENTS ================================================
  // A state the stable subscription does not hold is ARRANGED on a fresh
  // subscription of mine: ordered pay-later (pending), paid by a staff manual
  // payment (awaiting activation), activated (active), then moved on by the
  // client's own writes or the staff manual-status route. Every product
  // arranged here is closed by `afterAll`. Staff only ARRANGE — no staff call
  // is ever recorded.

  const MANAGER_BG =
    "I am an authenticated client acting on my own account, unless a scenario says otherwise";
  const STARTER_HOSTING = "3de78642-de53-9714-76df-21208469530d";
  const OFFLINE_GATEWAY = "4d036794-24d0-e710-275c-3153698d582e";

  type Arranged = { contractId: string; cpId: string; invoiceId: string };
  const arranged: Arranged[] = [];
  let staffToken: IToken | undefined;

  const asClient = (method: string, path: string, body?: unknown) =>
    control(method, path, clientToken.access_token, body);
  const asStaff = async (method: string, path: string, body?: unknown) => {
    staffToken ??= await mintStaffToken();
    return control(method, path, staffToken.access_token, body);
  };

  /** Orders one subscription pay-later — the product is left `pending`. */
  async function orderSubscription(
    productId: string = STARTER_HOSTING,
    billingCycleMonths = 1
  ): Promise<Arranged> {
    const order = await asClient("POST", "/api/orders", {
      category_slug: "new_contract",
      products: [
        {
          product_id: productId,
          quantity: 1,
          billing_cycle_months: billingCycleMonths
        }
      ]
    });
    const basketId = (order.body as { data?: { id?: string } })?.data?.id;
    const convert = await asClient("PATCH", `/api/orders/${basketId}/convert`, {
      type: PaymentType.PAY_LATER,
      amount: 0
    });
    const invoiceId =
      (convert.body as { data?: { id?: string } })?.data?.id ?? "";
    const invoice = (
      await asClient("GET", `/api/invoices/${invoiceId}?with=products`)
    ).body as {
      data?: {
        products?: { contract_id?: string; contracts_product_id?: string }[];
      };
    };
    const line = invoice?.data?.products?.[0];
    if (!line?.contract_id || !line.contracts_product_id)
      throw new Error(
        `Arranging a subscription failed: order ${order.status}, convert ${convert.status}: ${JSON.stringify(convert.body)}`
      );
    const target = {
      contractId: line.contract_id,
      cpId: line.contracts_product_id,
      invoiceId
    };
    arranged.push(target);
    return target;
  }

  /** Settles the order's invoice with a staff manual payment — `awaiting activation`. */
  async function payFor(target: Arranged): Promise<void> {
    const invoice = (await asClient("GET", `/api/invoices/${target.invoiceId}`))
      .body as { data?: { total_amount?: number; currency_id?: string } };
    const { status } = await asStaff("POST", "/api/admin/payments/manual", {
      invoice_id: target.invoiceId,
      client_id: clientId,
      amount: Math.max(1, Number(invoice?.data?.total_amount ?? 1)),
      gateway_id: OFFLINE_GATEWAY,
      currency_id: invoice?.data?.currency_id
    });
    if (status !== 200)
      throw new Error(`The manual payment answered ${status}.`);
  }

  /** A fresh, paid and activated subscription of mine. */
  async function arrangeActive(
    productId: string = STARTER_HOSTING,
    billingCycleMonths = 1
  ): Promise<Arranged> {
    const target = await orderSubscription(productId, billingCycleMonths);
    await payFor(target);
    const { status } = await asStaff(
      "PUT",
      `/api/admin/contracts/${target.contractId}/products/${target.cpId}/activate`
    );
    const read = (
      await asClient("GET", `/api/contract_products/${target.cpId}?with=status`)
    ).body as { data?: { status?: { code?: string } } };
    if (read?.data?.status?.code !== "contract_active")
      throw new Error(
        `Activating answered ${status}; the product reads ${read?.data?.status?.code}.`
      );
    return target;
  }

  async function setStatus(
    target: Arranged,
    statusCode: string
  ): Promise<void> {
    const { status } = await asStaff(
      "PATCH",
      `/api/admin/contracts/${target.contractId}/products/${target.cpId}/manual_status_on`,
      { status_code: statusCode }
    );
    if (status !== 200)
      throw new Error(`Setting ${statusCode} answered ${status}.`);
  }

  async function stopRenewingOf(target: Arranged): Promise<void> {
    const { status } = await asClient(
      "PUT",
      `/api/contracts/${target.contractId}/products/${target.cpId}/modify_renew`,
      { renew: false }
    );
    if (status !== 200)
      throw new Error(`Stopping the renewal answered ${status}.`);
  }

  async function lodgeRequestFor(target: Arranged): Promise<void> {
    const { status } = await asClient(
      "POST",
      `/api/contracts/${target.contractId}/cancel/request`,
      {
        product_ids: [target.cpId],
        cancellation_reason: "FE-3145 scenario recording — withdrawn same run"
      }
    );
    if (status !== 200)
      throw new Error(`Lodging the request answered ${status}.`);
  }

  async function withdrawRequestFor(target: Arranged): Promise<void> {
    const { body } = await asClient(
      "GET",
      `/api/contract_products/${target.cpId}?with=contract_request`
    );
    const requestId = (
      body as { data?: { contract_request?: { id?: string } } }
    )?.data?.contract_request?.id;
    if (requestId)
      await asClient(
        "DELETE",
        `/api/contracts/${target.contractId}/cancel/request`,
        {
          contract_request_id: requestId
        }
      );
  }

  async function raiseRenewalInvoice(target: Arranged): Promise<void> {
    const { status } = await asStaff(
      "POST",
      `/api/admin/invoices/contract/${target.contractId}/products/${target.cpId}/recurring`,
      {}
    );
    if (status !== 200)
      throw new Error(`Raising the renewal invoice answered ${status}.`);
  }

  /** The manager boot of one arranged product: its detail read plus its CANCEL_REQUEST catalogue. */
  const readManagerBootOf = (cpId: string) => async (generator: Generator) => {
    await generator.get(`/api/contract_products/${cpId}?with=${PRODUCT_WITH}`);
    await generator.get(
      "/api/custom_fields?filter[object_type]=contract_request&order=order&limit=0&offset=0"
    );
  };

  afterAll(async () => {
    await restoreCancellable();
    for (const target of arranged) {
      await withdrawRequestFor(target).catch(() => undefined);
      await setStatus(target, "contract_closed").catch(() => undefined);
    }
  }, 120000);

  /** Records a manager scenario whose second step boots an arranged product. */
  function recordArrangedScenario(
    scenario: string,
    given: string,
    rest: string[],
    arrange: () => Promise<Arranged>,
    after: (target: Arranged) => Promise<void> = async () => undefined
  ): void {
    describe(scenario, () => {
      it(MANAGER_BG, () => recordStep(scenario, MANAGER_BG, noRequest));
      it(given, async () => {
        const target = await arrange();
        await recordStep(scenario, given, readManagerBootOf(target.cpId));
        await after(target);
      });
      for (const line of rest)
        it(line, () => recordStep(scenario, line, noRequest));
    });
  }

  // === AC-17 · MY PRODUCT'S OWN STATE (outline, one arranged product per row) =

  const stateRows: [
    string,
    () => Promise<Arranged>,
    ((t: Arranged) => Promise<void>)?
  ][] = [
    ["pending", () => orderSubscription()],
    [
      "awaiting activation",
      async () => {
        const target = await orderSubscription();
        await payFor(target);
        return target;
      }
    ],
    ["active", () => arrangeActive()],
    [
      "suspended",
      async () => {
        const target = await arrangeActive();
        await setStatus(target, "contract_suspended");
        return target;
      }
    ],
    [
      "expiring",
      async () => {
        const target = await arrangeActive();
        await stopRenewingOf(target);
        return target;
      }
    ],
    [
      "being cancelled",
      async () => {
        const target = await arrangeActive();
        await lodgeRequestFor(target);
        return target;
      },
      withdrawRequestFor
    ],
    [
      "cancelled",
      async () => {
        const target = await arrangeActive();
        await setStatus(target, "contract_cancelled");
        return target;
      }
    ],
    [
      "lapsed",
      async () => {
        const target = await arrangeActive();
        await setStatus(target, "contract_closed");
        return target;
      }
    ]
  ];
  for (const [state, arrange, after] of stateRows) {
    const setup =
      state === "pending" || state === "awaiting activation"
        ? "still needs"
        : "no longer needs";
    recordArrangedScenario(
      `Open one of my products and see what state it is in — ${state}`,
      `one of my products is ${state}`,
      [
        "I look at it",
        `I am told it is ${state}, and in no other state of its lifecycle`,
        `I am told it ${setup} setting up`
      ],
      arrange,
      after
    );
  }

  recordArrangedScenario(
    "An expiring subscription is not the same as one that stopped invoicing",
    "one of my subscriptions is set to expire at the end of its term",
    [
      "I look at it",
      "it tells me it will expire",
      "it tells me the date it will end, and that it is ending because I asked it to stop renewing",
      "I am told separately whether its renewal invoicing is still on, as the product records it"
    ],
    async () => {
      const target = await arrangeActive();
      await stopRenewingOf(target);
      return target;
    }
  );

  // === AC-17 · A STATE ONLY THE PLATFORM PUTS IT IN ==========================
  // The trial that runs on: the catalogue's optional-trial product, ordered
  // with its trial started. It is priced for my currency on the annual cycle
  // only.

  const TRIAL_PRODUCT = "3de78642-de53-9714-986f-21208469530d";

  async function orderTrial(): Promise<Arranged> {
    const order = await asClient("POST", "/api/orders", {
      category_slug: "new_contract",
      products: [
        {
          product_id: TRIAL_PRODUCT,
          quantity: 1,
          billing_cycle_months: 12,
          start_trial: true
        }
      ]
    });
    const basketId = (order.body as { data?: { id?: string } })?.data?.id;
    const convert = await asClient("PATCH", `/api/orders/${basketId}/convert`, {
      type: PaymentType.PAY_LATER,
      amount: 0
    });
    const invoiceId =
      (convert.body as { data?: { id?: string } })?.data?.id ?? "";
    const invoice = (
      await asClient("GET", `/api/invoices/${invoiceId}?with=products`)
    ).body as {
      data?: {
        products?: { contract_id?: string; contracts_product_id?: string }[];
      };
    };
    const line = invoice?.data?.products?.[0];
    if (!line?.contract_id || !line.contracts_product_id)
      throw new Error(
        `Ordering the trial failed: order ${order.status}, convert ${convert.status}.`
      );
    const target = {
      contractId: line.contract_id,
      cpId: line.contracts_product_id,
      invoiceId
    };
    arranged.push(target);
    const read = (
      await asClient("GET", `/api/contract_products/${target.cpId}`)
    ).body as { data?: { in_trial?: boolean } };
    if (!read?.data?.in_trial)
      throw new Error("The ordered trial product does not read as in trial.");
    return target;
  }

  recordArrangedScenario(
    "Open one of my products while it is on trial",
    "one of my products is on trial",
    ["I look at it", "I am told it is on trial"],
    orderTrial
  );

  // A trial about to end is one that ends by cancelling: the optional-trial
  // product's end action is set to cancel for the order, then put back.
  async function orderEndingTrial(): Promise<Arranged> {
    const catalogue = `/api/admin/products/${TRIAL_PRODUCT}`;
    const before = (
      (await asStaff("GET", catalogue)).body as {
        data?: { trial_end_action?: TrialEndActionTypes };
      }
    )?.data?.trial_end_action;
    const { status } = await asStaff("PUT", catalogue, {
      trial_end_action: TrialEndActionTypes.CANCEL
    });
    if (status !== 200)
      throw new Error(
        `Setting the trial to end by cancelling answered ${status}.`
      );
    return orderTrial().finally(() =>
      asStaff("PUT", catalogue, {
        trial_end_action: before ?? TrialEndActionTypes.CONTINUE
      })
    );
  }

  recordArrangedScenario(
    "Open one of my products in a state only the platform puts it in — on a trial that is about to end",
    "one of my products is on a trial that is about to end",
    [
      "I open it to see its state",
      "I am told it is on a trial that is about to end"
    ],
    orderEndingTrial
  );

  // === AC-15 · WHAT IS SCHEDULED TO HAPPEN TO ONE OF MY PRODUCTS ============
  // Staff schedule a price change on a fresh subscription of mine; the action
  // is deleted after the recording.

  const scheduledActionsOf = (target: Arranged) =>
    `/api/admin/contracts/${target.contractId}/products/${target.cpId}/scheduled_actions`;

  recordArrangedScenario(
    "See what is scheduled to happen to one of my products",
    "one of my products has billing actions scheduled against it",
    [
      "I open that product's scheduled actions",
      "I see them",
      "they come from the product I already loaded, with no second request of my own"
    ],
    async () => {
      const target = await arrangeActive();
      const { status } = await asStaff("POST", scheduledActionsOf(target), {
        action_code: "price_change",
        values: {
          selling_price: 5,
          price_change_type: "fixed",
          currency_code: "GBP"
        }
      });
      if (status !== 200)
        throw new Error(`Scheduling the price change answered ${status}.`);
      return target;
    },
    async target => {
      const { body } = await asStaff("GET", scheduledActionsOf(target));
      for (const action of (body as { data?: { id: string }[] })?.data ?? [])
        await asStaff("DELETE", `${scheduledActionsOf(target)}/${action.id}`);
    }
  );

  // === AC-10 · AN OUTSTANDING RENEWAL INVOICE ================================

  recordArrangedScenario(
    "Know whether an outstanding invoice is still due, and still cancellable",
    "one of my products has an outstanding recurring invoice",
    [
      "I look at it",
      "I am told it has an unpaid recurring invoice",
      "I am told whether that invoice is still due",
      "I am told whether that invoice can still be cancelled"
    ],
    async () => {
      const target = await arrangeActive();
      await raiseRenewalInvoice(target);
      return target;
    }
  );

  // === AC-11 · A SUSPENDED SUBSCRIPTION IS STILL OFFERED EVERY CHANGE ======
  // The three rows share ONE arranged suspended subscription, so they record
  // together: re-record the outline by its title, never one row alone.

  let suspended: Arranged | undefined;
  const ensureSuspended = async (): Promise<Arranged> => {
    if (!suspended) {
      suspended = await arrangeActive();
      await setStatus(suspended, "contract_suspended");
    }
    return suspended;
  };
  const suspendedRows: [
    string,
    string,
    (generator: Generator, target: Arranged) => Promise<{ status: number }>,
    (target: Arranged) => Promise<unknown>
  ][] = [
    [
      "ask for it to stop renewing",
      "it is set to end at the end of its current term",
      (generator, target) =>
        generator.put(
          `/api/contracts/${target.contractId}/products/${target.cpId}/modify_renew`,
          { renew: false }
        ),
      target =>
        asClient(
          "PUT",
          `/api/contracts/${target.contractId}/products/${target.cpId}/modify_renew`,
          { renew: true }
        )
    ],
    [
      'set its consolidation to "opted out"',
      "that subscription's invoices are kept out of my consolidated invoice",
      (generator, target) =>
        generator.put(
          `/api/contracts/${target.contractId}/products/${target.cpId}/properties`,
          { invoice_consolidation_enabled: 0 }
        ),
      async () => undefined
    ],
    [
      "book a cancellation for a date I choose",
      "a cancellation is booked against it for a future date",
      (generator, target) =>
        generator.put(
          `/api/contracts/${target.contractId}/products/${target.cpId}/schedule-cancel`,
          { future_cancellation_date: futureDate }
        ),
      target =>
        asClient(
          "PUT",
          `/api/contracts/${target.contractId}/products/${target.cpId}/schedule-cancel-revoke`,
          {}
        )
    ]
  ];
  for (const [change, outcome, write, undo] of suspendedRows) {
    const scenario = `A suspended subscription is still offered every change — ${change}`;
    const given = "a suspended subscription on my account";
    describe(scenario, () => {
      it(MANAGER_BG, () => recordStep(scenario, MANAGER_BG, noRequest));
      it(given, async () => {
        const target = await ensureSuspended();
        await recordStep(scenario, given, readManagerBootOf(target.cpId));
      });
      it(`I ${change}`, async () => {
        const target = await ensureSuspended();
        await recordStep(scenario, `I ${change}`, async generator => {
          const { status } = await write(generator, target);
          if (status !== 200)
            throw new Error(`"${change}" answered ${status}.`);
          await generator.get(
            `/api/contract_products/${target.cpId}?with=${PRODUCT_WITH}`
          );
        });
        await undo(target);
      });
      it(outcome, () => recordStep(scenario, outcome, noRequest));
    });
  }

  // === AC-11 / AC-9 · IS EACH FORM OFFERED BEFORE I OPEN IT ================

  const ONE_OFF_PRODUCT = "47d73824-8507-9315-9e0b-81e642d59e06";

  const withActive =
    (
      move: (target: Arranged) => Promise<void>,
      productId: string = STARTER_HOSTING
    ) =>
    async (): Promise<Arranged> => {
      const target = await arrangeActive(productId);
      await move(target);
      return target;
    };

  async function bookFor(target: Arranged): Promise<void> {
    const { status } = await asClient(
      "PUT",
      `/api/contracts/${target.contractId}/products/${target.cpId}/schedule-cancel`,
      { future_cancellation_date: futureDate }
    );
    if (status !== 200)
      throw new Error(`Booking the cancellation answered ${status}.`);
  }

  /** Sets MY account's consolidation preference, returning the value it held. */
  async function setAccountConsolidation(value: number): Promise<number> {
    const before = (await asClient("GET", `/api/clients/${clientId}`)).body as {
      data?: { invoice_consolidation_enabled?: number };
    };
    const { status } = await asClient("PUT", `/api/clients/${clientId}`, {
      invoice_consolidation_enabled: value
    });
    if (status !== 200)
      throw new Error(`Setting my account's consolidation answered ${status}.`);
    return Number(before?.data?.invoice_consolidation_enabled ?? 1);
  }

  const cancellationOfferRows: [
    string,
    () => Promise<Arranged>,
    ((t: Arranged) => Promise<void>)?
  ][] = [
    ["an active subscription", () => arrangeActive()],
    ["a subscription already set to expire", withActive(stopRenewingOf)],
    [
      "a product with a cancellation booked for a future date",
      withActive(bookFor)
    ],
    [
      "a product with a cancellation request already pending",
      withActive(lodgeRequestFor),
      withdrawRequestFor
    ],
    [
      "a cancelled subscription",
      withActive(target => setStatus(target, "contract_cancelled"))
    ],
    ["a live one-off purchase", () => arrangeActive(ONE_OFF_PRODUCT, 0)]
  ];
  for (const [state, arrange, after] of cancellationOfferRows) {
    const offered =
      state === "an active subscription" ? "offered" : "not offered";
    recordArrangedScenario(
      `I am told whether the cancellation form is offered before I open it — ${state}`,
      `one of my products is ${state}`,
      [
        "I look at whether I can cancel it",
        `I am told the cancellation form is ${offered}`,
        "what I am told matches whether the cancellation form opens when I ask for it"
      ],
      arrange,
      after
    );
  }

  async function acceptRequestFor(target: Arranged): Promise<void> {
    await lodgeRequestFor(target);
    const { body } = await asClient(
      "GET",
      `/api/contract_products/${target.cpId}?with=contract_request`
    );
    const requestId = (
      body as { data?: { contract_request?: { id?: string } } }
    )?.data?.contract_request?.id;
    const { status } = await asStaff(
      "PATCH",
      `/api/admin/contracts/${target.contractId}/cancel/approve`,
      { contract_request_id: requestId }
    );
    if (status !== 200)
      throw new Error(`Accepting the request answered ${status}.`);
  }

  async function stopInvoicingOf(target: Arranged): Promise<void> {
    const { status } = await asStaff(
      "PUT",
      `/api/admin/contracts/${target.contractId}/products/${target.cpId}/stop_start_invoicing`,
      { invoicing: false }
    );
    if (status !== 200)
      throw new Error(`Switching renewal invoicing off answered ${status}.`);
  }

  const heldBackRows: [string, string, () => Promise<Arranged>][] = [
    [
      "its cancellation request was already accepted",
      "not shown",
      withActive(acceptRequestFor)
    ],
    [
      "its auto-renew is off and it has no end date",
      "offered",
      withActive(stopInvoicingOf)
    ]
  ];
  for (const [cause, shown, arrange] of heldBackRows)
    recordArrangedScenario(
      `I am told why the cancellation form is not available to me — ${cause}`,
      `one of my products is held back from cancelling because ${cause}`,
      [
        "I look at whether I can cancel it now",
        `I am told the cancellation is ${shown}`
      ],
      arrange
    );

  const PRO_PLAN = "825d96e7-63ed-0913-765f-417482528340";
  const TAX_FREE_HOSTING = "825d96e7-63ed-0913-52eb-417482528340";

  async function changeProductOf(
    target: Arranged,
    productId: string = PRO_PLAN
  ): Promise<void> {
    const { status } = await asStaff(
      "PUT",
      `/api/admin/contracts/${target.contractId}/products/${target.cpId}/change`,
      {
        product: { product_id: productId, quantity: 1, billing_cycle_months: 1 }
      }
    );
    if (status !== 200)
      throw new Error(`Changing the product answered ${status}.`);
  }

  let cancelAnytimeBefore: boolean | undefined;
  const catalogueOf = `/api/admin/products/${TAX_FREE_HOSTING}`;
  async function arrangeNotCancellable(): Promise<Arranged> {
    cancelAnytimeBefore = (
      (await asStaff("GET", catalogueOf)).body as {
        data?: { cancel_anytime?: boolean };
      }
    )?.data?.cancel_anytime;
    const { status } = await asStaff("PUT", catalogueOf, {
      cancel_anytime: false
    });
    if (status !== 200)
      throw new Error(`Refusing cancel-anytime answered ${status}.`);
    return arrangeActive(TAX_FREE_HOSTING, 1);
  }
  const restoreCancellable = async () => {
    if (cancelAnytimeBefore !== undefined)
      await asStaff("PUT", catalogueOf, {
        cancel_anytime: cancelAnytimeBefore
      });
    cancelAnytimeBefore = undefined;
  };

  async function arrangeNotCancellableOverdue(): Promise<Arranged> {
    const target = await arrangeNotCancellable();
    const { status, body } = await asStaff(
      "POST",
      `/api/admin/invoices/contract/${target.contractId}/products/${target.cpId}/recurring`,
      {}
    );
    const invoiceId = (body as { data?: { id?: string } })?.data?.id;
    if (status !== 200 || !invoiceId)
      throw new Error(`Raising the renewal invoice answered ${status}.`);
    const overdue = await asStaff("PUT", `/api/admin/invoices/${invoiceId}`, {
      due_date: "2026-08-01"
    });
    if (overdue.status !== 200)
      throw new Error(`Backdating the invoice answered ${overdue.status}.`);
    return target;
  }

  const guardRows: [
    string,
    () => Promise<Arranged>,
    ((t: Arranged) => Promise<void>)?
  ][] = [
    ["has a pending pro-rata invoice", withActive(changeProductOf)],
    [
      "has platform settings that do not allow cancelling",
      arrangeNotCancellable,
      restoreCancellable
    ],
    [
      "cannot be cancelled and has overdue invoices",
      arrangeNotCancellableOverdue,
      restoreCancellable
    ]
  ];
  for (const [hold, arrange, after] of guardRows)
    recordArrangedScenario(
      `I cannot ask to cancel a product the platform holds back from cancelling — ${hold}`,
      `one of my products ${hold}`,
      [
        "I ask to cancel it",
        "I am told I cannot ask to cancel it",
        "no cancellation form opens and no cancellation is sent"
      ],
      arrange,
      after
    );

  let accountBefore: number | undefined;
  const restoreAccount = async () => {
    if (accountBefore !== undefined)
      await setAccountConsolidation(accountBefore);
    accountBefore = undefined;
  };
  const withAccount = (value: number) => async (): Promise<Arranged> => {
    const target = await arrangeActive();
    accountBefore = await setAccountConsolidation(value);
    return target;
  };
  const consolidationOfferRows: [
    string,
    string,
    () => Promise<Arranged>,
    ((t: Arranged) => Promise<void>)?
  ][] = [
    [
      "a subscription, and my account consolidates",
      "offered",
      withAccount(1),
      restoreAccount
    ],
    [
      "a subscription, and my account follows its default",
      "offered",
      withAccount(2),
      restoreAccount
    ],
    [
      "a subscription, and my account never consolidates",
      "not offered",
      withAccount(0),
      restoreAccount
    ],
    [
      "a subscription already asked to stop renewing",
      "offered",
      withActive(stopRenewingOf)
    ],
    [
      "a one-off purchase, live",
      "not offered",
      () => arrangeActive(ONE_OFF_PRODUCT, 0)
    ],
    [
      "a one-off purchase, still pending",
      "not offered",
      () => orderSubscription(ONE_OFF_PRODUCT, 0)
    ],
    [
      "a cancelled subscription, for its invoicing",
      "not offered",
      withActive(target => setStatus(target, "contract_cancelled"))
    ],
    [
      "a lapsed subscription, for its invoicing",
      "not offered",
      withActive(target => setStatus(target, "contract_closed"))
    ]
  ];
  for (const [state, offered, arrange, after] of consolidationOfferRows)
    recordArrangedScenario(
      `I am told whether the consolidation form is offered before I open it — ${state}`,
      `one of my products is ${state}`,
      [
        "I look at whether I can change how it is invoiced",
        `I am told the consolidation form is ${offered}`,
        "what I am told matches whether the consolidation form opens when I ask for it"
      ],
      arrange,
      after
    );

  // === FE-3029 · THE CANCELLATION OPTIONS FOLLOW THE PRODUCT'S STATE =======

  recordArrangedScenario(
    "The cancellation form on a pending product offers the immediate request",
    "I have one of my products open that is still pending",
    [
      "I open the cancellation form",
      "the cancellation form is open",
      "it offers cancelling immediately"
    ],
    () => orderSubscription()
  );

  // === FE-3029 · A PRODUCT THAT IS NOT MINE =================================
  // Another client orders a pending subscription (uncaptured); my session
  // then reads it and records the refusal. Staff close it in `afterAll`.

  describe("Opening a product that is not mine fails, and I am shown why at once", () => {
    const s =
      "Opening a product that is not mine fails, and I am shown why at once";
    const given = "a product that is on another client's account";
    const when = "I open it as if it were one of mine";
    let foreign: Arranged | undefined;
    it(MANAGER_BG, () => recordStep(s, MANAGER_BG, noRequest));
    it(given, async () => {
      const other = (await mintOtherClientToken()).access_token;
      const order = await control("POST", "/api/orders", other, {
        category_slug: "new_contract",
        products: [
          { product_id: STARTER_HOSTING, quantity: 1, billing_cycle_months: 1 }
        ]
      });
      const basketId = (order.body as { data?: { id?: string } })?.data?.id;
      const convert = await control(
        "PATCH",
        `/api/orders/${basketId}/convert`,
        other,
        {
          type: PaymentType.PAY_LATER,
          amount: 0
        }
      );
      const invoiceId =
        (convert.body as { data?: { id?: string } })?.data?.id ?? "";
      const invoice = (
        await control("GET", `/api/invoices/${invoiceId}?with=products`, other)
      ).body as {
        data?: {
          products?: { contract_id?: string; contracts_product_id?: string }[];
        };
      };
      const line = invoice?.data?.products?.[0];
      if (!line?.contract_id || !line.contracts_product_id)
        throw new Error(
          `Arranging another client's product failed: ${order.status}/${convert.status}.`
        );
      foreign = {
        contractId: line.contract_id,
        cpId: line.contracts_product_id,
        invoiceId
      };
      arranged.push(foreign);
      await recordStep(s, given, noRequest);
    });
    it(when, () =>
      recordStep(s, when, async generator => {
        if (!foreign) throw new Error("No foreign product was arranged.");
        const { status } = await generator.get(
          `/api/contract_products/${foreign.cpId}?with=${PRODUCT_WITH}`
        );
        if (status < 400)
          throw new Error(
            `Reading another client's product answered ${status}.`
          );
        await generator.get(
          "/api/custom_fields?filter[object_type]=contract_request&order=order&limit=0&offset=0"
        );
      })
    );
    for (const line of [
      "I am shown the reason my read of it was refused",
      "the manager has stopped loading and reports an error",
      "I am told at once that the product is not ready"
    ])
      it(line, () => recordStep(s, line, noRequest));
  });

  // === FE-3029 · THE MANAGER FORMS (open / validate / close / reset) ========
  // Each opens from the manager boot alone — the forms open, validate and close
  // client-side, and a submit with no choice sends NO request (the wall proves
  // it). `reset` re-reads the product, answered by the boot's armed recording.

  const bgLine =
    "I am an authenticated client acting on my own account, unless a scenario says otherwise";
  const formScenarios: [string, string, string[]][] = [
    [
      "Open the cancellation form with the options my product allows",
      "I have one of my active subscriptions open",
      [
        "I open the cancellation form",
        "the cancellation form is open",
        "it offers cancelling at the end of the term, cancelling immediately, and cancelling on a future date I choose"
      ]
    ],
    [
      "A cancellation form I submit without a choice is not sent and tells me why",
      "I have the cancellation form open on one of my products",
      [
        "I submit the cancellation form without choosing an option",
        "the cancellation form stays open and is not valid",
        "I am shown that an option is required"
      ]
    ],
    [
      "Close the cancellation form without cancelling",
      "I have the cancellation form open on one of my products",
      [
        "I close the cancellation form",
        "the cancellation form is closed",
        "my product is still active"
      ]
    ],
    [
      "Open the consolidation form with the choices a subscription allows",
      "I have one of my active subscriptions open",
      [
        "I open the consolidation form",
        "the consolidation form is open",
        "it offers opting in, opting out, or following my account"
      ]
    ],
    [
      "A consolidation choice that changes nothing is not sent",
      "I have the consolidation form open on one of my subscriptions, with no choice made",
      [
        "I submit the consolidation form choosing the value my subscription already has",
        "my consolidation choice is not sent and the consolidation form stays open"
      ]
    ],
    ...(["reset", "refresh"] as const).map(
      again =>
        [
          `Read my product afresh — ${again}`,
          "I have one of my active subscriptions open",
          [
            `I ${again} my product`,
            "my product is read again and shown as active"
          ]
        ] as [string, string, string[]]
    )
  ];
  for (const [scenario, given, rest] of formScenarios) {
    describe(scenario, () => {
      it(bgLine, () => recordStep(scenario, bgLine, noRequest));
      it(given, () => recordStep(scenario, given, readManagerBoot));
      for (const line of rest)
        it(line, () =>
          recordStep(
            scenario,
            line,
            /^I (reset|refresh) my product$/.test(line)
              ? readProduct
              : noRequest
          )
        );
    });
  }

  // === AC-4 · OPEN ONE OF MY PRODUCTS =======================================

  describe("Open one of my products with what its detail view needs", () => {
    const s = "Open one of my products with what its detail view needs";
    const bg =
      "I am an authenticated client acting on my own account, unless a scenario says otherwise";
    it(bg, () => recordStep(s, bg, noRequest));
    it("I open one of my products", () =>
      recordStep(s, "I open one of my products", readManagerBoot));
    for (const line of [
      "it is the very product I opened, under its own name and description",
      "it arrives with the account and the client it belongs to",
      "with that client's image",
      "with its pending contract request, as the platform holds it",
      "with any cancellation that is scheduled for a future date, as the platform holds it",
      "with its catalogue product",
      "with the currency of that product's brand",
      "with that product's image",
      "with the payment method assigned to its contract",
      "with that method's gateway"
    ])
      it(line, () => recordStep(s, line, noRequest));
  });

  /** The pending-request id off a product detail body (for withdraw/restore). */
  const requestIdOf = (body: unknown): string | undefined => {
    const data = (body as { data?: Record<string, unknown> })?.data as
      | {
          contract?: { cancellation_request?: { id?: string } };
          contract_request?: { id?: string };
        }
      | undefined;
    return (
      data?.contract?.cancellation_request?.id ?? data?.contract_request?.id
    );
  };

  // === AC-6 · HARD CANCELLATION =============================================
  // The request's re-read is recorded BEFORE the request is withdrawn.

  describe("Ask for one of my products to be cancelled outright", () => {
    const s = "Ask for one of my products to be cancelled outright";
    const given =
      "an active product on my account, with the cancellation form open";
    const when =
      "I choose to cancel it immediately, giving my reason, and submit the form";
    it(MANAGER_BG, () => recordStep(s, MANAGER_BG, noRequest));
    it(given, () => recordStep(s, given, readManagerBoot));
    it(when, () =>
      recordStep(s, when, async generator => {
        await generator.post(`/api/contracts/${contractId}/cancel/request`, {
          product_ids: [productId],
          cancellation_reason: "FE-3145 recording — withdrawn same run"
        });
        const { body } = await generator.get(
          `/api/contract_products/${productId}?with=${PRODUCT_WITH}`
        );
        const reqId = requestIdOf(body);
        if (reqId)
          await control(
            "DELETE",
            `/api/contracts/${contractId}/cancel/request`,
            clientToken.access_token,
            { contract_request_id: reqId }
          );
      })
    );
    for (const line of [
      "my cancellation request is lodged against my product, with my reason",
      "my product is shown to me as being cancelled, as the platform re-read it",
      "no cancellation form is left open behind it"
    ])
      it(line, () => recordStep(s, line, noRequest));
  });

  // === AC-7 · WITHDRAW A CANCELLATION REQUEST ===============================

  describe("Change my mind about a cancellation I asked for", () => {
    const s = "Change my mind about a cancellation I asked for";
    const bg =
      "I am an authenticated client acting on my own account, unless a scenario says otherwise";
    it(bg, () => recordStep(s, bg, noRequest));
    it("I have an outstanding cancellation request on one of my products", () =>
      recordStep(
        s,
        "I have an outstanding cancellation request on one of my products",
        async generator => {
          // Arrange the pending state uncaptured, then record the manager boot
          // reading it as pending.
          await control(
            "POST",
            `/api/contracts/${contractId}/cancel/request`,
            clientToken.access_token,
            {
              product_ids: [productId],
              cancellation_reason:
                "fixture capture — withdrawn in the When step"
            }
          );
          await generator.get(
            `/api/contract_products/${productId}?with=${PRODUCT_WITH}`
          );
          await generator.get(
            "/api/custom_fields?filter[object_type]=contract_request&order=order&limit=0&offset=0"
          );
        }
      ));
    it("I withdraw it", () =>
      recordStep(s, "I withdraw it", async generator => {
        const { body } = await control(
          "GET",
          `/api/contract_products/${productId}?with=${PRODUCT_WITH}`,
          clientToken.access_token
        );
        const reqId = requestIdOf(body);
        await generator.delete(
          `/api/contracts/${contractId}/cancel/request`,
          reqId ? { contract_request_id: reqId } : {}
        );
        await generator.get(
          `/api/contract_products/${productId}?with=${PRODUCT_WITH}`
        );
      }));
    for (const line of [
      "my product no longer carries that request",
      "my product is no longer shown as being cancelled"
    ])
      it(line, () => recordStep(s, line, noRequest));
  });

  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  // === AC-5 · STOP-RENEWING IS NOT THE RENEWAL-INVOICING PERMISSION ==========
  // "not allowed" is the stable subscription (its catalogue product forbids
  // switching renewal invoicing off); "allowed" is a fresh Starter Hosting
  // subscription, whose catalogue product permits it.

  for (const permission of ["not allowed", "allowed"] as const) {
    const s = `Stopping a subscription renewing is not the renewal-invoicing permission — ${permission}`;
    describe(s, () => {
      const given = `a subscription on my account that is ${permission} to have its renewal invoicing switched off`;
      let target: Arranged | undefined;
      const ids = () =>
        target
          ? { c: target.contractId, p: target.cpId }
          : { c: contractId, p: productId };
      it(MANAGER_BG, () => recordStep(s, MANAGER_BG, noRequest));
      it(given, async () => {
        if (permission === "allowed") target = await arrangeActive();
        await recordStep(s, given, readManagerBootOf(ids().p));
      });
      it("I ask for it to stop renewing", () =>
        recordStep(s, "I ask for it to stop renewing", async generator => {
          const { c, p } = ids();
          await generator.put(
            `/api/contracts/${c}/products/${p}/modify_renew`,
            {
              renew: false
            }
          );
          await generator.get(
            `/api/contract_products/${p}?with=${PRODUCT_WITH}`
          );
          await control(
            "PUT",
            `/api/contracts/${c}/products/${p}/modify_renew`,
            clientToken.access_token,
            { renew: true }
          );
        }));
      for (const line of [
        "it is still set to end at the end of its current term — that permission does not govern this change",
        "I am told its renewal invoicing as the platform now holds it"
      ])
        it(line, () => recordStep(s, line, noRequest));
    });
  }

  // === AC-22 · BOOK A CANCELLATION ON A DATE I CHOOSE (outline, 2 rows) ======
  // The booking's re-read is recorded BEFORE the booking is revoked, so the
  // scenario reads the date the platform booked.

  for (const giving of ["with my reason", "without a reason"] as const) {
    const s = `Book a cancellation for one of my products on a date I choose — ${giving}`;
    const given =
      "an active product on my account, with no cancellation already booked";
    const when = `I book a cancellation for a date I choose, ${giving}`;
    describe(s, () => {
      it(MANAGER_BG, () => recordStep(s, MANAGER_BG, noRequest));
      it(given, () =>
        recordStep(s, given, async generator => {
          await control(
            "PUT",
            `/api/contracts/${contractId}/products/${productId}/schedule-cancel-revoke`,
            clientToken.access_token,
            {}
          ).catch(() => undefined);
          await readManagerBoot(generator);
        })
      );
      it(when, () =>
        recordStep(s, when, async generator => {
          await generator.put(
            `/api/contracts/${contractId}/products/${productId}/schedule-cancel`,
            giving === "with my reason"
              ? {
                  future_cancellation_date: futureDate,
                  cancellation_reason: "FE-3145 recording — revoked same run"
                }
              : { future_cancellation_date: futureDate }
          );
          await generator.get(
            `/api/contract_products/${productId}?with=${PRODUCT_WITH}`
          );
          await control(
            "PUT",
            `/api/contracts/${contractId}/products/${productId}/schedule-cancel-revoke`,
            clientToken.access_token,
            {}
          );
        })
      );
      for (const line of [
        "that cancellation is scheduled against my product for the date I chose",
        giving === "with my reason"
          ? "my reason is recorded against the booking"
          : "the platform's own wording is recorded against the booking, not a reason of mine",
        "my product's own status is unchanged — a scheduled cancellation is not the hard cancellation request",
        "no cancellation request is asked for on my behalf"
      ])
        it(line, () => recordStep(s, line, noRequest));
    });
  }

  // === AC-9 · CONSOLIDATION (outline, 3 rows) ===============================
  // Each row first moves the stable subscription to a value OTHER than the
  // one it chooses (uncaptured), records the boot reading it, submits the
  // choice and records the re-read, then restores the original value.

  for (const [choice, value, start] of [
    ["opted out", 0, 2],
    ["opted in", 1, 0],
    ["follow my account", 2, 0]
  ] as const) {
    const s = `Decide whether one subscription joins my consolidated invoice — ${choice}`;
    const outcome = {
      "opted out": "kept out of my consolidated invoice",
      "opted in": "joined to my consolidated invoice",
      "follow my account": "consolidated exactly as the rest of my account is"
    }[choice];
    const given =
      "a subscription on my account, with its consolidation form open";
    const when = `I submit "${choice}" in the consolidation form`;
    const setValue = (v: number) =>
      control(
        "PUT",
        `/api/contracts/${contractId}/products/${productId}/properties`,
        clientToken.access_token,
        { invoice_consolidation_enabled: v }
      );
    describe(s, () => {
      const bg =
        "I am an authenticated client acting on my own account, unless a scenario says otherwise";
      it(bg, () => recordStep(s, bg, noRequest));
      it(given, async () => {
        await setValue(start);
        await recordStep(s, given, readManagerBoot);
      });
      it(when, async () => {
        await recordStep(s, when, async generator => {
          await generator.put(
            `/api/contracts/${contractId}/products/${productId}/properties`,
            { invoice_consolidation_enabled: value }
          );
          await generator.get(
            `/api/contract_products/${productId}?with=${PRODUCT_WITH}`
          );
        });
        await setValue(currentConsolidation);
      });
      for (const line of [
        `that subscription's invoices are ${outcome}`,
        "my account-level consolidation preference is left exactly as it was",
        "no consolidation form is left open behind it"
      ])
        it(line, () => recordStep(s, line, noRequest));
    });
  }

  // === AC-21 · RENEWAL-INVOICING ON / OFF (outline, 2 rows) =================

  for (const [state, id] of [
    ["on", () => productId],
    ["off", () => renewalOffProductId]
  ] as const) {
    const s = `Know whether a product still invoices its own renewal — ${state}`;
    describe(s, () => {
      const bg =
        "I am an authenticated client acting on my own account, unless a scenario says otherwise";
      it(bg, () => recordStep(s, bg, noRequest));
      it(`a product whose renewal invoicing is ${state}`, () =>
        recordStep(
          s,
          `a product whose renewal invoicing is ${state}`,
          async generator => {
            await generator.get(
              `/api/contract_products/${id()}?with=${PRODUCT_WITH}`
            );
            await generator.get(
              "/api/custom_fields?filter[object_type]=contract_request&order=order&limit=0&offset=0"
            );
          }
        ));
      it("I open that product", () =>
        recordStep(s, "I open that product", noRequest));
      it(`I am told its renewal invoicing is ${state}`, () =>
        recordStep(
          s,
          `I am told its renewal invoicing is ${state}`,
          noRequest
        ));
    });
  }

  // === AC-25 · A CHANGE IN FLIGHT ===========================================

  describe("While a change of mine is in flight, the module says so", () => {
    const s = "While a change of mine is in flight, the module says so";
    const bg =
      "I am an authenticated client acting on my own account, unless a scenario says otherwise";
    it(bg, () => recordStep(s, bg, noRequest));
    it("one of my products", () =>
      recordStep(s, "one of my products", readManagerBoot));
    it("I ask for a change", () =>
      recordStep(s, "I ask for a change", async generator => {
        await generator.put(
          `/api/contracts/${contractId}/products/${productId}/modify_renew`,
          { renew: false }
        );
        await generator.get(
          `/api/contract_products/${productId}?with=${PRODUCT_WITH}`
        );
        // Restore: resume so the subscription is left renewing.
        await control(
          "PUT",
          `/api/contracts/${contractId}/products/${productId}/modify_renew`,
          clientToken.access_token,
          { renew: true }
        );
      }));
    for (const line of [
      "the module reports itself busy while the change is in flight",
      "it reports itself settled once the change has landed",
      "what it shows me afterwards is my product as the platform re-read it",
      "I am told the change is done"
    ])
      it(line, () => recordStep(s, line, noRequest));
  });

  // === AC-23 · REVOKE A BOOKED CANCELLATION =================================

  describe("Revoke a scheduled cancellation I booked", () => {
    const s = "Revoke a scheduled cancellation I booked";
    const bg =
      "I am an authenticated client acting on my own account, unless a scenario says otherwise";
    it(bg, () => recordStep(s, bg, noRequest));
    it("one of my products has a cancellation booked for a future date", () =>
      recordStep(
        s,
        "one of my products has a cancellation booked for a future date",
        async generator => {
          // Arrange the booking uncaptured, then record the boot reading it.
          await control(
            "PUT",
            `/api/contracts/${contractId}/products/${productId}/schedule-cancel-revoke`,
            clientToken.access_token,
            {}
          ).catch(() => undefined);
          await control(
            "PUT",
            `/api/contracts/${contractId}/products/${productId}/schedule-cancel`,
            clientToken.access_token,
            { future_cancellation_date: futureDate }
          );
          await readManagerBoot(generator);
        }
      ));
    it("I revoke that booking", () =>
      recordStep(s, "I revoke that booking", async generator => {
        await generator.put(
          `/api/contracts/${contractId}/products/${productId}/schedule-cancel-revoke`,
          {}
        );
        // The machine re-reads after the write; capture the product with no booking.
        await generator.get(
          `/api/contract_products/${productId}?with=${PRODUCT_WITH}`
        );
      }));
    it("my product no longer carries a scheduled cancellation", () =>
      recordStep(
        s,
        "my product no longer carries a scheduled cancellation",
        noRequest
      ));
    it("my product's own status is unchanged by the revoke, exactly as the booking left it unchanged", () =>
      recordStep(
        s,
        "my product's own status is unchanged by the revoke, exactly as the booking left it unchanged",
        noRequest
      ));
  });

  // === AC-1 · A PRODUCT'S NEXT-DUE AND BILLING CYCLE ========================

  describe("My product shows when it next falls due and how often it bills", () => {
    const s = "My product shows when it next falls due and how often it bills";
    const bg =
      "I am an authenticated client acting on my own account, unless a scenario says otherwise";
    it(bg, () => recordStep(s, bg, noRequest));
    it("I open one of my products", () =>
      recordStep(s, "I open one of my products", readManagerBoot));
    it("it is read", () => recordStep(s, "it is read", noRequest));
    for (const line of [
      "it shows the date it next falls due",
      "it shows how often it bills, in words"
    ])
      it(line, () => recordStep(s, line, noRequest));
  });

  // === AC-22 · THE EARLIEST CANCELLATION DATE ===============================

  describe("The earliest date I can book a cancellation for is the one my product allows", () => {
    const s =
      "The earliest date I can book a cancellation for is the one my product allows";
    const bg =
      "I am an authenticated client acting on my own account, unless a scenario says otherwise";
    it(bg, () => recordStep(s, bg, noRequest));
    it("an active subscription on my account", () =>
      recordStep(s, "an active subscription on my account", readManagerBoot));
    it("I look at when I could book its cancellation for", () =>
      recordStep(
        s,
        "I look at when I could book its cancellation for",
        noRequest
      ));
    it("I am told the earliest date I am allowed to choose", () =>
      recordStep(
        s,
        "I am told the earliest date I am allowed to choose",
        noRequest
      ));
  });

  // === AC-5 · STOP RENEWING, AND CHANGE MY MIND (outline, 2 rows) ============

  for (const giving of ["with my reason", "without a reason"] as const) {
    const s = `Stop one of my subscriptions renewing, and change my mind — ${giving}`;
    describe(s, () => {
      const stop = `I ask for it to stop renewing, ${giving}`;
      it(MANAGER_BG, () => recordStep(s, MANAGER_BG, noRequest));
      it("an active subscription on my account", () =>
        recordStep(s, "an active subscription on my account", readManagerBoot));
      it(stop, () =>
        recordStep(s, stop, async generator => {
          await generator.put(
            `/api/contracts/${contractId}/products/${productId}/modify_renew`,
            giving === "with my reason"
              ? {
                  renew: false,
                  cancellation_reason: "FE-3145 recording — resumed same run"
                }
              : { renew: false }
          );
          await generator.get(
            `/api/contract_products/${productId}?with=${PRODUCT_WITH}`
          );
        })
      );
      it("it is set to end at the end of its current term", () =>
        recordStep(
          s,
          "it is set to end at the end of its current term",
          noRequest
        ));
      it("I ask for it to carry on instead", () =>
        recordStep(s, "I ask for it to carry on instead", async generator => {
          await generator.put(
            `/api/contracts/${contractId}/products/${productId}/modify_renew`,
            { renew: true }
          );
          await generator.get(
            `/api/contract_products/${productId}?with=${PRODUCT_WITH}`
          );
        }));
      it("it renews as before", () =>
        recordStep(s, "it renews as before", noRequest));
    });
  }

  // === AC-20 · THE PURCHASED CATEGORIES =====================================

  describe("Browse the categories I have already bought into", () => {
    const s = "Browse the categories I have already bought into";
    const bg =
      "I am an authenticated client acting on my own account, unless a scenario says otherwise";
    it(bg, () => recordStep(s, bg, noRequest));
    it("I am signed in and I have bought products in several categories", () =>
      recordStep(
        s,
        "I am signed in and I have bought products in several categories",
        readCollectionBoot
      ));
    it("I ask for the categories I have bought into", () =>
      recordStep(
        s,
        "I ask for the categories I have bought into",
        readCategories
      ));
    for (const line of [
      "the categories I have bought into are requested",
      "the shop catalogue is not requested",
      "my delegated choice rides that request"
    ])
      it(line, () => recordStep(s, line, noRequest));
  });

  // === AC-19 · THE GROUPED COUNTS ===========================================

  describe("Ask for my products grouped by category and see a count for each", () => {
    const s =
      "Ask for my products grouped by category and see a count for each";
    const bg =
      "I am an authenticated client acting on my own account, unless a scenario says otherwise";
    it(bg, () => recordStep(s, bg, noRequest));
    it("I have opened my products", () =>
      recordStep(s, "I have opened my products", readCollectionBoot));
    it("I ask for my grouped counts", () =>
      recordStep(s, "I ask for my grouped counts", readGroupedCounts));
    for (const line of [
      "my products surface holds the entries I was given, one per category, each with its count",
      "each category is split by service identifier, each with its own count"
    ])
      it(line, () => recordStep(s, line, noRequest));
  });

  // === AC-1 · THE LIST ROWS, THE PRICES AND THE PICKER ======================

  /** The collection boot, then the paged read and its count, narrowed by `filter`. */
  const readNarrowedList = (filter: string) => async (generator: Generator) => {
    await readCollectionBoot(generator);
    await generator.get(
      `/api/contracts_products?with=${LIST_WITH}&split_count=1&exclude_delegated=1&skip_count=1&order=created_at&limit=10&offset=0&${filter}`
    );
    await generator.get(
      `/api/contracts_products?with=${LIST_WITH}&split_count=1&exclude_delegated=1&skip_count=1&limit=count&order=created_at&${filter}`
    );
  };

  /**
   * The portal brand read, recorded only when staging's brand already prices
   * without tax — the state the scenario needs is verified, never written.
   */
  const readBrandWithoutTax = async (generator: Generator) => {
    const { body } = await generator.get("/api/brand/settings");
    const taxType = (body as { data?: { tax_type?: number } })?.data?.tax_type;
    if (taxType !== 0)
      throw new Error(
        `The staging brand does not price without tax (tax_type ${taxType}).`
      );
  };

  for (const [s, steps] of [
    [
      "Each of my products shows the date I bought it",
      ["each one shows the date I bought it"]
    ],
    [
      "Each of my products shows its status in words, with one flag for that status",
      [
        "each one shows the name of its status, and only the flag for that status is raised"
      ]
    ],
    [
      "Each of my products shows how often it bills, in words",
      ["each one shows its billing cycle as a word, never a number of months"]
    ]
  ] as const) {
    describe(s, () => {
      it(bgLine, () => recordStep(s, bgLine, noRequest));
      it("I am looking at my products", () =>
        recordStep(s, "I am looking at my products", readCollectionBoot));
      it("my products are read", () =>
        recordStep(s, "my products are read", noRequest));
      for (const line of steps) it(line, () => recordStep(s, line, noRequest));
    });
  }

  // The Background step records the portal brand read, so the seed boots on it.
  const priceScenarios: [
    string,
    string,
    (g: Generator) => Promise<unknown>,
    string
  ][] = [
    [
      "A subscription in my list shows what it costs each time it renews, as my brand's tax rule prices it",
      "my subscriptions are read",
      readNarrowedList("filter[billing_cycle_days|neq]=0"),
      "each subscription shows its renewal price before tax, as my brand formats it"
    ],
    [
      "A subscription I open shows what it costs each time it renews, as my brand's tax rule prices it",
      "I open one of my subscriptions",
      readManagerBoot,
      "it shows its renewal price before tax as my brand formats it, never the price with tax added"
    ],
    [
      "A one-time purchase shows the price I paid for it, as my brand's tax rule prices it",
      "my one-time purchases are read",
      readNarrowedList("filter[billing_cycle_days|eq]=0"),
      "each one-time purchase shows its purchase price before tax, never a renewal price of nothing"
    ]
  ];
  for (const [s, when, read, outcome] of priceScenarios) {
    describe(s, () => {
      it(bgLine, () => recordStep(s, bgLine, readBrandWithoutTax));
      it("my brand prices its products without tax", () =>
        recordStep(s, "my brand prices its products without tax", noRequest));
      it(when, () => recordStep(s, when, read));
      it(outcome, () => recordStep(s, outcome, noRequest));
    });
  }

  describe("Picking one of my products opens that very product", () => {
    const s = "Picking one of my products opens that very product";
    let pickedId = "";
    it(bgLine, () => recordStep(s, bgLine, noRequest));
    it("I have no product open yet", () =>
      recordStep(s, "I have no product open yet", async generator => {
        await readPreference(generator);
        const { body } = await generator.get(
          `/api/contracts_products?with=${LIST_WITH}&split_count=1&exclude_delegated=1&skip_count=1&order=created_at&limit=10&offset=0`
        );
        await generator.get(
          `/api/contracts_products?with=${LIST_WITH}&split_count=1&exclude_delegated=1&skip_count=1&limit=count&order=created_at`
        );
        pickedId = (body as { data?: { id: string }[] })?.data?.[1]?.id ?? "";
        if (!pickedId)
          throw new Error("The products list offered fewer than two products.");
      }));
    it("I pick one of my products", () =>
      recordStep(s, "I pick one of my products", async generator => {
        await generator.get(
          `/api/contract_products/${pickedId}?with=${PRODUCT_WITH}`
        );
        await generator.get(
          "/api/custom_fields?filter[object_type]=contract_request&order=order&limit=0&offset=0"
        );
      }));
    it("the product the manager opens is the one I picked", () =>
      recordStep(
        s,
        "the product the manager opens is the one I picked",
        noRequest
      ));
  });

  // === AC-2 / AC-18 · NEVER SHOWN DELEGATED PRODUCTS I DO NOT HAVE ==========
  // The recording client has NOTHING delegated to it (its `/self` carries
  // `delegated_ids: null`, checked below). Each row ARRANGES the choice it
  // made before on the client's own meta (the key legacy stores,
  // views/client/products/index.vue:150-165), records the boot, and restores
  // the meta. Legacy then asks with `exclude_delegated=1` whatever was chosen.

  for (const [choice, excludeDelegated] of [
    ["see", 0],
    ["hide", 1]
  ] as const) {
    const s = `Never be shown delegated products I do not have — ${choice}`;
    describe(s, () => {
      let heldMeta: Record<string, unknown> | undefined;

      const clientMeta = async () =>
        (
          (
            await control(
              "GET",
              `/api/clients/${clientId}`,
              clientToken.access_token
            )
          ).body as { data?: { meta?: Record<string, unknown> | null } }
        )?.data?.meta ?? {};

      afterAll(async () => {
        if (!heldMeta) return;
        await control(
          "PUT",
          `/api/clients/${clientId}`,
          clientToken.access_token,
          { meta: heldMeta }
        );
        const restored = await clientMeta();
        if (
          UserMetaKeys.UI_PRODUCTS_EXCLUDE_DELEGATES in heldMeta
            ? restored[UserMetaKeys.UI_PRODUCTS_EXCLUDE_DELEGATES] !==
              heldMeta[UserMetaKeys.UI_PRODUCTS_EXCLUDE_DELEGATES]
            : restored[UserMetaKeys.UI_PRODUCTS_EXCLUDE_DELEGATES] != null
        )
          throw new Error(
            `Restoring the client's meta left ${UserMetaKeys.UI_PRODUCTS_EXCLUDE_DELEGATES}=${JSON.stringify(restored[UserMetaKeys.UI_PRODUCTS_EXCLUDE_DELEGATES])}.`
          );
      }, 60000);

      it(bgLine, () => recordStep(s, bgLine, noRequest));
      it("no products have been delegated to me", () =>
        recordStep(s, "no products have been delegated to me", async () => {
          const self = await control(
            "GET",
            "/api/self?with=delegated_ids",
            clientToken.access_token
          );
          const delegated = (
            self.body as { data?: { delegated_ids?: unknown } }
          )?.data?.delegated_ids;
          if (delegated != null && !isEmpty(delegated))
            throw new Error(
              `The recording client has products delegated to it: ${JSON.stringify(delegated)}.`
            );
        }));
      it(`I asked to ${choice} delegated products before`, () =>
        recordStep(
          s,
          `I asked to ${choice} delegated products before`,
          async () => {
            heldMeta = await clientMeta();
            const { status, body } = await control(
              "PUT",
              `/api/clients/${clientId}`,
              clientToken.access_token,
              {
                meta: {
                  ...heldMeta,
                  [UserMetaKeys.UI_PRODUCTS_EXCLUDE_DELEGATES]: excludeDelegated
                }
              }
            );
            if (status >= 400)
              throw new Error(
                `Arranging the delegated choice failed: ${status} ${JSON.stringify(body).slice(0, 300)}`
              );
          }
        ));
      it("I open my products", () =>
        recordStep(s, "I open my products", async generator => {
          await readPreference(generator);
          await generator.get(
            `/api/contracts_products?with=${LIST_WITH}&split_count=1&exclude_delegated=1&skip_count=1&order=created_at&limit=10&offset=0`
          );
          await generator.get(
            `/api/contracts_products?with=${LIST_WITH}&split_count=1&exclude_delegated=1&skip_count=1&limit=count&order=created_at`
          );
        }));
      it("delegated products are excluded", () =>
        recordStep(s, "delegated products are excluded", noRequest));
    });
  }
  // === AC-2 / AC-18 · PRODUCTS DELEGATED TO ME ==============================
  // A REAL delegation: the delegate owner invites my account, I accept from the
  // invitation email, and the owner grants me one of its products (legacy
  // useDelegate `full_delegate:false` + `add_contract_product_ids`). The
  // delegation is removed afterwards. My choice is the show-delegated key of my
  // account's meta, written as the legacy toggle writes it and put back after.

  const SESSION_SELF =
    "/api/self?with_count=actor.child_client_configs&with=actor,actor.account,actor.brand,actor.image,actor.parent_client_config.parent_client,actor.parent_client_config.parent_client.image,accounts,delegated_ids,enabled_modules";
  const ACCEPT_LINK = /delegate_access\/accept\/([A-Za-z0-9]+)/;
  const INVITATION_SUBJECT = "New Customer Access Invitation";

  const idOfSelf = async (accessToken: string): Promise<string> => {
    const data = (
      (await control("GET", "/api/self", accessToken)).body as {
        data?: { actor?: { id?: string }; actor_id?: string };
      }
    )?.data;
    return data?.actor?.id ?? data?.actor_id ?? "";
  };

  const delegatedToMe = async (): Promise<Record<string, string[]> | null> =>
    (
      (
        await control(
          "GET",
          "/api/self?with=delegated_ids",
          clientToken.access_token
        )
      ).body as { data?: { delegated_ids?: Record<string, string[]> | null } }
    )?.data?.delegated_ids ?? null;

  const myMeta = async (): Promise<Record<string, unknown>> =>
    (
      (
        await control(
          "GET",
          `/api/clients/${clientId}`,
          clientToken.access_token
        )
      ).body as { data?: { meta?: Record<string, unknown> | null } }
    )?.data?.meta ?? {};

  async function setMyMeta(meta: Record<string, unknown>): Promise<void> {
    const { status, body } = await control(
      "PUT",
      `/api/clients/${clientId}`,
      clientToken.access_token,
      { meta }
    );
    if (status >= 400)
      throw new Error(
        `Writing my meta answered ${status}: ${JSON.stringify(body).slice(0, 300)}`
      );
  }

  /** Arranges a real per-product delegation to my account for the enclosing describe. */
  function withProductsDelegatedToMe(): void {
    let ownerToken: IToken | undefined;
    let ownerId = "";
    let email: string | undefined;
    let heldMeta: Record<string, unknown> | undefined;

    /** The owner's delegate record for my account, by the email it invited. */
    const myRecord = async (): Promise<string | undefined> =>
      find(
        (
          (
            await control(
              "GET",
              `/api/clients/${ownerId}/delegates`,
              ownerToken!.access_token
            )
          ).body as { data?: { id: string; invite_email: string }[] }
        )?.data ?? [],
        { invite_email: email }
      )?.id;

    beforeAll(async () => {
      if (!isEmpty(await delegatedToMe()))
        throw new Error("My account already holds a delegation.");
      heldMeta = await myMeta();
      ownerToken = await mintToken({
        grant_type: GrantTypes.PASSWORD,
        username: API_CREDENTIALS.delegateOwner.username,
        password: API_CREDENTIALS.delegateOwner.password
      });
      if (!ownerToken) throw new Error("Could not mint the delegate owner.");
      ownerId = await idOfSelf(ownerToken.access_token);
      const ownerProduct = (
        (
          await control(
            "GET",
            "/api/contracts_products?limit=1",
            ownerToken.access_token
          )
        ).body as { data?: { id: string }[] }
      )?.data?.[0]?.id;
      email = (
        (
          await control(
            "GET",
            `/api/clients/${clientId}`,
            clientToken.access_token
          )
        ).body as { data?: { email?: string } }
      )?.data?.email;
      if (!ownerId || !ownerProduct || !email)
        throw new Error("The delegate owner holds no product to delegate.");

      const inbox = async () =>
        (
          (
            await control(
              "GET",
              "/api/self/email_history?order=-created_at&limit=25",
              clientToken.access_token
            )
          ).body as { data?: { id: string; subject: string }[] }
        )?.data ?? [];
      const known = new Set((await inbox()).map(row => row.id));

      const invite = await control(
        "POST",
        `/api/clients/${ownerId}/delegates`,
        ownerToken.access_token,
        { delegate_email: email, full_delegate: true }
      );
      if (invite.status >= 400)
        throw new Error(
          `The delegation invite answered ${invite.status}: ${JSON.stringify(invite.body).slice(0, 300)}`
        );

      let invitation: string | undefined;
      for (let attempt = 0; attempt < 30 && !invitation; attempt += 1) {
        invitation = find(
          await inbox(),
          row => !known.has(row.id) && row.subject === INVITATION_SUBJECT
        )?.id;
        if (!invitation)
          await new Promise(resolve => setTimeout(resolve, 2000));
      }
      if (!invitation)
        throw new Error(
          `No "${INVITATION_SUBJECT}" reached my inbox within 60s.`
        );
      const letter = (
        await control(
          "GET",
          `/api/emails/${invitation}?with=data`,
          clientToken.access_token
        )
      ).body as { data?: { data?: { body?: string } } };
      const hash = ACCEPT_LINK.exec(letter?.data?.data?.body ?? "")?.[1];
      if (!hash) throw new Error("The invitation carries no accept link.");
      const accept = await control(
        "PATCH",
        `/api/delegate_access/accept/${hash}`,
        clientToken.access_token
      );
      if (accept.status >= 400)
        throw new Error(`Accepting the delegation answered ${accept.status}.`);

      const recordId = await myRecord();
      if (!recordId) throw new Error("The accepted delegation has no record.");
      const grant = await control(
        "PUT",
        `/api/clients/${ownerId}/delegates/${recordId}`,
        ownerToken.access_token,
        { full_delegate: false, add_contract_product_ids: [ownerProduct] }
      );
      if (grant.status >= 400)
        throw new Error(`Granting the product answered ${grant.status}.`);
      if (isEmpty((await delegatedToMe())?.contracts_product))
        throw new Error(
          "My session holds no delegated product after the grant."
        );
    }, 120000);

    afterAll(async () => {
      if (heldMeta) await setMyMeta(heldMeta);
      const recordId = ownerToken && email ? await myRecord() : undefined;
      if (recordId)
        await control(
          "DELETE",
          `/api/clients/${ownerId}/delegates/${recordId}`,
          ownerToken!.access_token
        );
      if (!isEmpty(await delegatedToMe()))
        throw new Error("Removing the delegation left my account a delegate.");
    }, 60000);
  }

  /** My show-delegated choice, as the legacy toggle writes it (0 shows, 1 hides). */
  const chooseDelegated = async (choice: "see" | "hide") =>
    setMyMeta({
      ...(await myMeta()),
      [UserMetaKeys.UI_PRODUCTS_EXCLUDE_DELEGATES]: choice === "see" ? 0 : 1
    });

  /** My own view of my products, read as my choice has it. */
  const readMyView =
    (choice: "see" | "hide") => async (generator: Generator) => {
      const excludeDelegated = choice === "see" ? 0 : 1;
      const others = await totalOf("");
      const withDelegated = (
        (
          await control(
            "GET",
            `/api/contracts_products?with=${LIST_WITH}&split_count=1&exclude_delegated=0&skip_count=1&limit=count&order=created_at`,
            clientToken.access_token
          )
        ).body as { total: number }
      ).total;
      if (!(withDelegated > others))
        throw new Error(
          "My products read the same with and without delegation."
        );
      await readPreference(generator);
      for (const paging of [
        "&order=created_at&limit=10&offset=0",
        "&limit=count&order=created_at"
      ])
        await generator.get(
          `/api/contracts_products?with=${LIST_WITH}&split_count=1&exclude_delegated=${excludeDelegated}&skip_count=1${paging}`
        );
    };

  const recordSessionSelf = async (generator: Generator) => {
    await generator.get(SESSION_SELF);
  };

  for (const [choice, outcome] of [
    ["see", "the products delegated to me are included alongside my own"],
    ["hide", "only my own products come back"]
  ] as const) {
    const s = `Choose whether to see products delegated to me — ${choice}`;
    describe(s, () => {
      withProductsDelegatedToMe();
      it(COLLECTION_BG, () => recordStep(s, COLLECTION_BG, recordSessionSelf));
      it("products have been delegated to me by another account", () =>
        recordStep(
          s,
          "products have been delegated to me by another account",
          noRequest
        ));
      it(`I ask to ${choice} delegated products`, async () => {
        await chooseDelegated(choice);
        await recordStep(
          s,
          `I ask to ${choice} delegated products`,
          readMyView(choice)
        );
      });
      it(outcome, () => recordStep(s, outcome, noRequest));
    });
  }

  for (const [choice, outcome] of [
    ["see", "my products still include the ones delegated to me"],
    ["hide", "my products still leave out the ones delegated to me"]
  ] as const) {
    const s = `My choice about delegated products is remembered — ${choice}`;
    describe(s, () => {
      withProductsDelegatedToMe();
      it(COLLECTION_BG, () => recordStep(s, COLLECTION_BG, recordSessionSelf));
      it("products have been delegated to me", () =>
        recordStep(s, "products have been delegated to me", noRequest));
      it(`I have asked to ${choice} them`, async () => {
        await chooseDelegated(choice);
        await recordStep(s, `I have asked to ${choice} them`, noRequest);
      });
      it("I come back later, in a new session", () =>
        recordStep(
          s,
          "I come back later, in a new session",
          readMyView(choice)
        ));
      for (const line of [
        `${outcome} — I do not have to ask again`,
        "remembering my choice does not disturb any other preference I have set on my account"
      ])
        it(line, () => recordStep(s, line, noRequest));
    });
  }

  // === FE-3206 · CHANGING THE PLAN ==========================================
  // Staff ARRANGE the change of plan for the recording (tasks.md, the
  // arrangement table): the source plan S allows five monthly plans, and the
  // empty source plan S0 allows only the one-off plan. A staff change moves
  // the product onto its new plan while the pro-rata invoice is unpaid, so the
  // plan it moves to allows a change back (arrangement check 7 reads the new
  // plan, not S). Each row orders its own
  // fresh subscription of S or S0. `afterAll` detaches each allowed plan; the
  // outer `afterAll` closes each arranged subscription. The count and the list
  // are recorded as the manager asks for them (design 8.1), so each answer is
  // the platform's own.

  describe("CHANGING THE PLAN (FE-3206)", () => {
    const SOURCE_PLAN = "20403869-6e54-721d-2e7c-518d9305e7d2";
    const EMPTY_SOURCE_PLAN = "47d73824-8507-9315-920b-81e642d59e06";
    // In the brand's own order, the first four are the first page, so each
    // plan a row picks is on it: TE, TP, TR and TO, then T1 and T2.
    const REACHABLE_PLANS = [
      "825d96e7-63ed-0913-752b-417482528340",
      "8d632507-9806-5d1e-629b-8174e234e98d",
      "47d73824-8507-9315-6ddb-81e642d59e06",
      "8d632507-9806-5d1e-688a-8174e234e98d",
      "8d632507-9806-5d1e-de4a-8174e234e98d",
      "47d73824-8507-9315-748f-81e642d59e06"
    ];
    // TE: its monthly price is the monthly price of S; it is let change back.
    const PLAN_OF_THE_SAME_PRICE = REACHABLE_PLANS[0];
    // TP: its `hostname` provision field is required.
    const PLAN_WITH_PROVISIONING = REACHABLE_PLANS[1];
    // TR: one required multiple choice with no default, "FE-3206 Pick one" (2)
    // or "FE-3206 Pick two" (5).
    const PLAN_WITH_A_REQUIRED_CHOICE = REACHABLE_PLANS[2];
    // TO: one required single choice, "FE-3206 Small" (3, the default) or
    // "FE-3206 Large" (9).
    const PLAN_WITH_OPTIONS = REACHABLE_PLANS[3];
    const SMALL = "2785d26e-9678-3d16-458f-314502e70439";
    const LARGE = "825d96e7-63ed-0913-589a-417482528340";
    const PRO_RATA_TARGET = REACHABLE_PLANS[5];
    const PICK_ONE = "5d085e69-d562-3719-63df-218e940d4237";
    // S activates itself once paid; a plan that waits for staff to activate it
    // is the only way to read "paid for but not yet active".
    const MANUAL_ACTIVATION_PLAN = STARTER_HOSTING;
    const IMPORT_BRAND = "2785d26e-9678-3d16-999f-314502e70439";
    const TARGETS_OF: Record<string, string[]> = {
      [SOURCE_PLAN]: REACHABLE_PLANS,
      [EMPTY_SOURCE_PLAN]: [ONE_OFF_PRODUCT],
      [PRO_RATA_TARGET]: [SOURCE_PLAN],
      [PLAN_OF_THE_SAME_PRICE]: [SOURCE_PLAN],
      [MANUAL_ACTIVATION_PLAN]: REACHABLE_PLANS
    };
    const attached: [string, string][] = [];
    const detached: [string, string][] = [];
    let allowed: Promise<void> | undefined;

    /** Each plan `source` allows, keyed by the plan, valued by its link id. */
    const linksOf = async (source: string): Promise<Record<string, string>> => {
      const { body } = await asStaff(
        "GET",
        `/api/admin/products/${source}?with=allowed_migrations`
      );
      const links =
        (
          body as {
            data?: {
              allowed_migrations?: {
                id: string;
                migration_product_id: string;
              }[];
            };
          }
        )?.data?.allowed_migrations ?? [];
      return Object.fromEntries(
        links.map(link => [link.migration_product_id, link.id])
      );
    };

    // A link is removed by its own id, not by the plan it names.
    const unlink = async (source: string, target: string) => {
      const link = (await linksOf(source))[target];
      if (link)
        await asStaff(
          "DELETE",
          `/api/admin/products/${source}/allowed_migrations/${link}`
        );
    };

    const allowMigrations = () =>
      (allowed ??= (async () => {
        for (const [source, targets] of Object.entries(TARGETS_OF)) {
          const held = await linksOf(source);
          for (const extra of keys(held).filter(id => !targets.includes(id))) {
            await unlink(source, extra);
            detached.push([source, extra]);
          }
          const missing = targets.filter(target => !held[target]);
          if (!missing.length) continue;
          const { status, body } = await asStaff(
            "POST",
            `/api/admin/products/${source}/allowed_migrations`,
            { migration_product_ids: missing }
          );
          if (status !== 200)
            throw new Error(
              `Allowing the change of plan answered ${status}: ${JSON.stringify(body)}`
            );
          for (const target of missing) attached.push([source, target]);
        }
      })());

    afterAll(async () => {
      for (const [source, target] of attached)
        await unlink(source, target).catch(() => undefined);
      for (const [source, target] of detached)
        await asStaff(
          "POST",
          `/api/admin/products/${source}/allowed_migrations`,
          { migration_product_ids: [target] }
        ).catch(() => undefined);
    }, 120000);

    type GateRead = {
      can_modify: boolean;
      pro_rata_pending: boolean;
      staged_import: boolean;
      status?: { code: string };
      allowed_migrations?: { migration_product_id: string }[];
      product?: { id: string };
      contract?: { account_id: string; currency_id: string };
    };

    const gateRead = async (target: Arranged): Promise<GateRead> =>
      (
        (
          await asClient(
            "GET",
            `/api/contract_products/${target.cpId}?with=allowed_migrations,contract,product,status`
          )
        ).body as { data: GateRead }
      ).data;

    /** Fails the arrangement when the product does not read as the row needs (arrangement checks 7 and 8). */
    function expectGate(
      read: GateRead,
      need: Partial<GateRead>,
      row: string,
      needsAllowedPlans = true
    ) {
      if (needsAllowedPlans && isEmpty(read.allowed_migrations))
        throw new Error(`${row}: the product reads no allowed plan.`);
      for (const [key, value] of Object.entries(need)) {
        const got =
          key === "status"
            ? read.status?.code
            : (read as Record<string, unknown>)[key];
        const want =
          key === "status" ? (value as { code: string }).code : value;
        if (got !== want)
          throw new Error(
            `${row}: the product reads ${key} ${JSON.stringify(got)}, not ${JSON.stringify(want)}.`
          );
      }
    }

    const PLAN_LOAD_WITH =
      "image,images,prices,products_attributes,products_attributes.icon,products_options,products_options.icon,products_options.prices,category.top_category.top_category.top_category.top_category,provision_blueprint.category";
    const afterForSale: string[] = [];
    const setForSale = async (planId: string, value: 0 | 1) => {
      const { status } = await asStaff("PUT", `/api/admin/products/${planId}`, {
        available_for_sales: value
      });
      if (status !== 200)
        throw new Error(
          `Setting ${planId} for sale to ${value} answered ${status}.`
        );
      if (!value) afterForSale.push(planId);
    };
    afterAll(async () => {
      for (const planId of afterForSale)
        await asStaff("PUT", `/api/admin/products/${planId}`, {
          available_for_sales: 1
        }).catch(() => undefined);
    }, 120000);

    const PLAN_WITH =
      "image,images,prices,products_attributes,products_options,products_options.prices,category.top_category.top_category.top_category.top_category";
    const scopeParams = (read: GateRead) =>
      `&account_id=${read.contract?.account_id}` +
      `&currency_id=${read.contract?.currency_id}` +
      `&filter[id]=${(read.allowed_migrations ?? [])
        .map(entry => entry.migration_product_id)
        .join(",")}` +
      "&filter[available_for_sales]=1&filter[clients_can_order]=1" +
      "&filter[provision_blueprint.category.code|neq]=domain-names&order=order";

    const readCount = (read: GateRead) => (generator: Generator) =>
      generator.get(
        `/api/basket/products?limit=count&filter[billing_cycle_months|neq]=0${scopeParams(read)}&with=${PLAN_WITH}`
      );

    const readPage =
      (read: GateRead, term: number, offset: number) =>
      (generator: Generator) =>
        generator.get(
          `/api/basket/products?limit=4&offset=${offset}&filter[prices.billing_cycle_months]=${term}${scopeParams(read)}&with=${PLAN_WITH}`
        );

    const bootWithCount =
      (target: Arranged, read: GateRead) => async (generator: Generator) => {
        await readManagerBootOf(target.cpId)(generator);
        await readCount(read)(generator);
      };

    /** One arranged row: its own fresh subscription, its gate read checked, its boot and count recorded. */
    function recordMigrationScenario(
      scenario: string,
      given: string,
      arrange: () => Promise<Arranged>,
      need: Partial<GateRead>,
      steps: [
        string,
        (read: GateRead) => (generator: Generator) => Promise<unknown>
      ][],
      needsAllowedPlans = true
    ): void {
      describe(scenario, () => {
        let read: GateRead;
        it(MANAGER_BG, () => recordStep(scenario, MANAGER_BG, noRequest));
        it(
          given,
          async () => {
            await allowMigrations();
            const target = await arrange();
            read = await gateRead(target);
            expectGate(read, need, scenario, needsAllowedPlans);
            await recordStep(scenario, given, bootWithCount(target, read));
          },
          120000
        );
        for (const [line, requests] of steps)
          it(line, () => recordStep(scenario, line, requests(read)));
      });
    }

    const none = () => noRequest;
    const lines = (...text: string[]) =>
      text.map(line => [line, none] as [string, typeof none]);

    for (const [state, arrange, need] of [
      ["active", () => arrangeActive(SOURCE_PLAN), { can_modify: true }],
      [
        "suspended",
        withActive(
          target => setStatus(target, "contract_suspended"),
          SOURCE_PLAN
        ),
        { can_modify: true, status: { code: "contract_suspended" } }
      ]
    ] as const)
      recordMigrationScenario(
        `I am told I can change the plan of a subscription whose plan allows it — ${state}`,
        `one of my subscriptions is ${state}, on a plan that allows changes to other plans`,
        arrange,
        need,
        lines(
          "I look at whether I can change its plan",
          "I am told I can change its plan",
          "I am told which plans its plan allows me to change to",
          "I am told how many plans I can change to"
        )
      );

    recordMigrationScenario(
      "I am told how many plans I can change my subscription to",
      "one of my subscriptions is active, on a plan that allows changes to other plans",
      () => arrangeActive(SOURCE_PLAN),
      { can_modify: true },
      lines(
        "I look at whether I can change its plan",
        "the platform is asked for a count of plans, not a page of them",
        "the plans are counted in my contract's currency",
        "the plans are counted on my contract's account",
        "only plans on a recurring billing term are counted",
        "only plans the brand sells are counted",
        "only plans a client can order are counted",
        "only the plans my plan allows are counted",
        "the plans are counted in the brand's own order",
        "each counted plan is asked for with its image",
        "I am told the number of plans the platform counted"
      )
    );

    const REFUSED = [
      "I ask to change its plan",
      "I am told I cannot change its plan",
      "the change of plan does not open",
      "the number of plans I can change to is still read",
      "no plan list is requested",
      "no change is sent"
    ];

    for (const [hold, arrange, need] of [
      [
        "has a cancellation request pending",
        withActive(lodgeRequestFor, SOURCE_PLAN),
        { can_modify: true }
      ],
      [
        "had its cancellation request accepted",
        withActive(acceptRequestFor, SOURCE_PLAN),
        {}
      ],
      [
        "is set to expire at the end of its term",
        withActive(stopRenewingOf, SOURCE_PLAN),
        { can_modify: true }
      ]
    ] as const)
      recordMigrationScenario(
        `A change of plan is not offered while my subscription is held back — ${hold}`,
        `one of my subscriptions, on a plan that allows changes to other plans, ${hold}`,
        arrange,
        need,
        lines(...REFUSED)
      );

    recordMigrationScenario(
      "A change of plan is not offered before my subscription is active",
      "one of my subscriptions, on a plan that allows changes to other plans, is paid for but not yet active",
      async () => {
        const target = await orderSubscription(MANUAL_ACTIVATION_PLAN);
        await payFor(target);
        return target;
      },
      { status: { code: "contract_awaiting_activation" } },
      lines(...REFUSED)
    );

    recordMigrationScenario(
      "A change of plan cannot start while a pro-rata invoice of mine is unpaid",
      "one of my subscriptions, on a plan that allows changes to other plans, has a pro-rata invoice I have not paid",
      withActive(
        target => changeProductOf(target, PRO_RATA_TARGET),
        SOURCE_PLAN
      ),
      { pro_rata_pending: true },
      lines(
        "I ask to change its plan",
        "I am told a pro-rata invoice of mine is unpaid",
        "I am told I cannot change its plan",
        "the change of plan does not open",
        "the number of plans I can change to is still read",
        "no plan list is requested",
        "no change is sent"
      )
    );

    const BLOCKED = [
      "I ask to change its plan",
      "I am told I cannot change its plan",
      "the change of plan does not open",
      "no plan list is requested",
      "no change is sent"
    ];

    // Staging keeps the type of an existing product, so the bundle is created
    // fresh. The body is the legacy admin create (vue-app addProductModal.vue:280-380).
    // Staging refuses allowed plans on a bundle (409), so the bundle links none.
    const BUNDLE_CATEGORY = "78985742-6489-7012-0e4c-21e325d0ed36";
    const BUNDLE_NAME = "FE-3206 Bundle — deleted same run";
    let bundleId: string | undefined;
    let bundleTarget: Arranged | undefined;

    // A product the platform will not delete is retired from sale and renamed,
    // so the next run's name lookup does not find it again.
    const removeBundle = async (id: string) => {
      const removed = await asStaff(
        "DELETE",
        `/api/admin/products/${id}`
      ).catch(() => undefined);
      if (!removed || removed.status >= 400)
        await asStaff("PUT", `/api/admin/products/${id}`, {
          name: "FE-3206 Bundle — retired",
          available_for_sales: 0,
          clients_can_order: 0
        }).catch(() => undefined);
    };

    const removeLeftoverBundles = async () => {
      const { body } = await asStaff(
        "GET",
        `/api/admin/products?filter[name]=${encodeURIComponent(BUNDLE_NAME)}&limit=50`
      );
      const leftovers = filter(
        (body as { data?: { id: string; name?: string }[] })?.data,
        { name: BUNDLE_NAME }
      );
      for (const leftover of leftovers) await removeBundle(leftover.id);
    };

    const contractCurrency = async (): Promise<string> => {
      const listed = await asClient("GET", "/api/contracts_products?limit=1");
      const row = (
        listed.body as { data?: { id?: string; contract_id?: string }[] }
      )?.data?.[0];
      if (!row?.id)
        throw new Error(
          `No subscription to read the contract currency from: ${JSON.stringify(listed.body)}`
        );
      const product = await asClient(
        "GET",
        `/api/contract_products/${row.id}?with=contract`
      );
      const fromProduct = (
        product.body as { data?: { contract?: { currency_id?: string } } }
      )?.data?.contract?.currency_id;
      if (fromProduct) return fromProduct;
      const contract = await asClient(
        "GET",
        `/api/contracts/${row.contract_id}`
      );
      const fromContract = (
        contract.body as { data?: { currency_id?: string } }
      )?.data?.currency_id;
      if (!fromContract)
        throw new Error(
          `No contract currency to price the bundle in: product ${JSON.stringify(product.body)}; contract ${JSON.stringify(contract.body)}`
        );
      return fromContract;
    };

    const brandPricelist = async (): Promise<string> => {
      const { body } = await asStaff(
        "GET",
        `/api/admin/brands/${IMPORT_BRAND}`
      );
      const pricelist = (body as { data?: { pricelist_id?: string } })?.data
        ?.pricelist_id;
      if (!pricelist)
        throw new Error(
          `The brand reads no pricelist_id: ${JSON.stringify(body)}`
        );
      return pricelist;
    };

    async function priceBundle(id: string): Promise<void> {
      const pricelistId = await brandPricelist();
      const payload = {
        prices: [
          {
            currency_id: await contractCurrency(),
            billing_cycle_months: 1,
            price: 10,
            pricelist_id: pricelistId
          }
        ]
      };
      const path = `/api/admin/pricelists/${pricelistId}/${id}`;
      const assigned = await asStaff("POST", path, payload);
      if (assigned.status === 200) return;
      const updated = await asStaff("PUT", path, payload);
      if (updated.status !== 200)
        throw new Error(
          `Pricing the bundle answered POST ${assigned.status}: ${JSON.stringify(assigned.body)}; PUT ${updated.status}: ${JSON.stringify(updated.body)}`
        );
    }

    async function createBundle(): Promise<string> {
      await removeLeftoverBundles();
      const created = await asStaff("POST", "/api/admin/products", {
        name: BUNDLE_NAME,
        description: "",
        products_category_id: BUNDLE_CATEGORY,
        product_type: 2,
        contract_type: 0,
        available_for_sales: 1,
        clients_can_order: 1,
        billing_cycle_months: 1,
        order_type: OrderTypes.SINGLE_OPTION,
        currency_id: "",
        brand_id: IMPORT_BRAND,
        set_products: [],
        set_order_type: 0,
        set_price_type: 1
      });
      const id = (created.body as { data?: { id?: string } })?.data?.id;
      if (!id)
        throw new Error(
          `Creating the bundle answered ${created.status}: ${JSON.stringify(created.body)}`
        );
      bundleId = id;
      await priceBundle(id);
      const read = await asStaff(
        "GET",
        `/api/admin/products/${id}?with=prices`
      );
      const data = (
        read.body as {
          data?: {
            product_type?: number | string;
            prices?: { billing_cycle_months?: number | string }[];
          };
        }
      )?.data;
      if (Number(data?.product_type) !== 2)
        throw new Error(
          `The created bundle reads product_type ${data?.product_type}: ${JSON.stringify(read.body)}`
        );
      if (
        !find(data?.prices, price => Number(price.billing_cycle_months) === 1)
      )
        throw new Error(
          `The created bundle has no monthly price: ${JSON.stringify(read.body)}`
        );
      return id;
    }

    // The product is removed only once its subscription is closed.
    afterAll(async () => {
      if (!bundleId) return;
      if (bundleTarget)
        await setStatus(bundleTarget, "contract_closed").catch(() => undefined);
      await removeBundle(bundleId);
    }, 120000);

    recordMigrationScenario(
      "A change of plan is not offered for a bundle of products",
      "one of my subscriptions is a bundle of products",
      async () => {
        bundleTarget = await arrangeActive(await createBundle());
        return bundleTarget;
      },
      { can_modify: true, status: { code: "contract_active" } },
      lines(...BLOCKED),
      false
    );

    describe("A change of plan is not offered when my plan allows no change", () => {
      const s = "A change of plan is not offered when my plan allows no change";
      it(MANAGER_BG, () => recordStep(s, MANAGER_BG, noRequest));
      it("one of my subscriptions is active, on a plan that allows no changes to other plans", () =>
        recordStep(
          s,
          "one of my subscriptions is active, on a plan that allows no changes to other plans",
          readManagerBoot
        ));
      for (const line of [
        "I ask to change its plan",
        "I am told I cannot change its plan",
        "the change of plan does not open",
        "no plan count is requested",
        "no plan list is requested",
        "no change is sent"
      ])
        it(line, () => recordStep(s, line, noRequest));
    });

    recordMigrationScenario(
      "See the plans I can change my subscription to",
      "one of my subscriptions is active, on a plan that allows changes to five or more plans",
      () => arrangeActive(SOURCE_PLAN),
      { can_modify: true },
      [
        ["I ask to change its plan", read => readPage(read, 1, 0)],
        ...lines(
          "the change of plan opens on the plans I can choose from",
          "the plans are asked for in my contract's currency",
          "the plans are asked for on my contract's account",
          "only plans on my subscription's current billing term are asked for",
          "only plans the brand sells are asked for",
          "only plans a client can order are asked for",
          "only the plans my plan allows are asked for",
          "the plans are asked for in the brand's own order",
          "four plans are asked for",
          "the plans are asked for from the first plan on",
          "each plan is asked for with its image and its prices",
          "I see the plans the platform returned, in its order",
          "I am told there are more plans to see"
        )
      ]
    );

    describe("See more of the plans I can change my subscription to", () => {
      const s = "See more of the plans I can change my subscription to";
      const given =
        "I have opened a change of plan on a subscription whose plan allows changes to five or more plans";
      let read: GateRead;
      it(MANAGER_BG, () => recordStep(s, MANAGER_BG, noRequest));
      it(
        given,
        async () => {
          await allowMigrations();
          const target = await arrangeActive(SOURCE_PLAN);
          read = await gateRead(target);
          expectGate(read, { can_modify: true }, s);
          await recordStep(s, given, async generator => {
            await bootWithCount(target, read)(generator);
            await readPage(read, 1, 0)(generator);
          });
        },
        120000
      );
      it("I ask to see more plans", () =>
        recordStep(s, "I ask to see more plans", readPage(read, 1, 4)));
      for (const line of [
        "four more plans are asked for",
        "the plans are asked for from the fifth plan on",
        "I see the first four plans followed by the plans the platform returned next",
        "I am told whether there are more plans to see, as the platform's total says"
      ])
        it(line, () => recordStep(s, line, noRequest));
    });

    recordMigrationScenario(
      "No plan is available to change my subscription to",
      "one of my subscriptions is active, on a plan whose allowed plans are none I can order on its billing term",
      () => arrangeActive(EMPTY_SOURCE_PLAN),
      { can_modify: true },
      [
        ["I ask to change its plan", read => readPage(read, 1, 0)],
        ...lines(
          "the change of plan opens on the plans I can choose from",
          "I am told there is no plan I can change to",
          "I am told there are no more plans to see",
          "I am told the number of plans I can change to is zero"
        )
      ]
    );

    // --- configuring, pricing and committing a change of plan --------------
    // Each row orders its own fresh subscription of S. The Given records the
    // boot, the count and each page the row reads to reach its plan; the plan
    // load and each dry run are recorded where the client's step sends them.
    // One step holds one answer for one request, so a step that prices twice
    // keeps the last answer (the generator's own map).

    type Line = [string, number];
    type Change = { status: number; body: unknown };

    const PRODUCT_READ_OF = (target: Arranged) =>
      `/api/contract_products/${target.cpId}?with=${PRODUCT_WITH}`;
    const changeUrl = (target: Arranged) =>
      `/api/contracts/${target.contractId}/products/${target.cpId}/change`;
    const changeBody = (target: Arranged, planId: string, options: Line[]) => ({
      contract_id: target.contractId,
      contracts_product_id: target.cpId,
      product: { product_id: planId, billing_cycle_months: 1 },
      options: options.map(([product_id, price]) => ({
        product_id,
        billing_cycle_months: 1,
        unit_quantity: 1,
        price
      })),
      attributes: []
    });

    /** The provision read the configurator makes after a parse, for the options it holds. */
    const readProvisionFields = (
      generator: Generator,
      planId: string,
      selected: string[] = []
    ) =>
      generator.get(
        `/api/basket/products/${planId}/provision_fields${selected.length ? `?${selected.map(id => `sub_product_ids[]=${id}`).join("&")}` : ""}`
      );

    const loadPlan =
      (read: GateRead, planId: string, selected: string[] = []) =>
      async (generator: Generator) => {
        await generator.get(
          `/api/basket/products/${planId}?with=${PLAN_LOAD_WITH}&currency_id=${read.contract?.currency_id}&omit_promotions=1`
        );
        await readProvisionFields(generator, planId);
        if (selected.length)
          await readProvisionFields(generator, planId, selected);
      };

    const dryRun = async (
      generator: Generator,
      target: Arranged,
      planId: string,
      options: Line[]
    ): Promise<Change> =>
      generator.put(changeUrl(target), {
        ...changeBody(target, planId, options),
        dry_run: true
      });

    const commit = (
      generator: Generator,
      target: Arranged,
      planId: string,
      options: Line[]
    ): Promise<Change> =>
      generator.put(changeUrl(target), changeBody(target, planId, options));

    const invoiceIdOf = (change: Change) =>
      (change.body as { data?: { id?: string } })?.data?.id;
    const raised: string[] = [];
    afterAll(async () => {
      for (const invoiceId of raised)
        await cancelHatOrder(invoiceId).catch(() => undefined);
    }, 120000);

    /** Fails the arrangement when an answer is not the one the row needs. */
    function expectAnswer(change: Change, ok: boolean, what: string) {
      if (change.status < 300 !== ok)
        throw new Error(
          `${what} answered ${change.status}: ${JSON.stringify(change.body)}`
        );
    }

    /** The pages the list reads until `planId` is a loaded row. */
    async function openOn(
      generator: Generator,
      read: GateRead,
      planId: string
    ): Promise<void> {
      for (let offset = 0; ; offset += 4) {
        const page = await readPage(read, 1, offset)(generator);
        const rows = (page.body as { data?: { id: string }[] })?.data ?? [];
        if (find(rows, { id: planId })) return;
        if (rows.length < 4)
          throw new Error(`The plan list holds no row of ${planId}.`);
      }
    }

    type Row = {
      read: GateRead;
      target: Arranged;
    };

    /**
     * One arranged row: the Given boots the product on a fresh S and runs
     * `given` after the boot and the count; each later line runs its own
     * requests against the same row.
     */
    function recordChangeScenario(
      scenario: string,
      given: string,
      arrangeGiven: (generator: Generator, row: Row) => Promise<void>,
      steps: [string, (generator: Generator, row: Row) => Promise<unknown>][],
      between: (row: Row) => Promise<void> = async () => undefined
    ): void {
      describe(scenario, () => {
        const row = {} as Row;
        it(MANAGER_BG, () => recordStep(scenario, MANAGER_BG, noRequest));
        it(
          given,
          async () => {
            await allowMigrations();
            row.target = await arrangeActive(SOURCE_PLAN);
            row.read = await gateRead(row.target);
            expectGate(row.read, { can_modify: true }, scenario);
            await recordStep(scenario, given, async generator => {
              await bootWithCount(row.target, row.read)(generator);
              await arrangeGiven(generator, row);
            });
            await between(row);
          },
          120000
        );
        for (const [line, requests] of steps)
          it(
            line,
            () =>
              recordStep(scenario, line, generator => requests(generator, row)),
            120000
          );
      });
    }

    const quiet = (text: string[]) =>
      text.map(
        line => [line, async () => undefined] as [string, () => Promise<void>]
      );

    const pickPriced =
      (planId: string, options: Line[]) =>
      async (generator: Generator, { read, target }: Row) => {
        await openOn(generator, read, planId);
        await loadPlan(
          read,
          planId,
          options.map(([id]) => id)
        )(generator);
        expectAnswer(
          await dryRun(generator, target, planId, options),
          true,
          "The dry run"
        );
      };
    const pickSmall = pickPriced(PLAN_WITH_OPTIONS, [[SMALL, 3]]);
    const pickSamePrice = pickPriced(PLAN_OF_THE_SAME_PRICE, []);

    const commitAndReread =
      (planId: string, options: Line[], ok = true) =>
      async (generator: Generator, { target }: Row) => {
        const change = await commit(generator, target, planId, options);
        expectAnswer(change, ok, "The commit");
        const invoiceId = invoiceIdOf(change);
        if (invoiceId) raised.push(invoiceId);
        if (ok) await generator.get(PRODUCT_READ_OF(target));
      };

    recordChangeScenario(
      "Choose a plan and see what the change costs before I commit",
      "I have opened a change of plan on one of my active subscriptions",
      (generator, { read }) => openOn(generator, read, PLAN_WITH_OPTIONS),
      [
        [
          "I choose the plan with options to change to",
          async (generator, { read, target }) => {
            await loadPlan(read, PLAN_WITH_OPTIONS, [SMALL])(generator);
            const dry = await dryRun(generator, target, PLAN_WITH_OPTIONS, [
              [SMALL, 3]
            ]);
            expectAnswer(dry, true, "The dry run");
          }
        ],
        ...quiet([
          "the plan I chose is loaded in my contract's currency",
          "the plan I chose is loaded without promotions",
          "the plan I chose starts on my subscription's current billing term",
          "no price calculation is asked for the plan I chose",
          "the cost of the change is asked for without committing it",
          "the cost asked for names my contract",
          "the cost asked for names my product",
          "the cost asked for names the plan I chose",
          "the cost asked for names my subscription's current billing term",
          "the cost asked for carries each option I chose, by its product",
          "each option carries its billing term",
          "each option carries its quantity",
          "each option whose price differs from mine carries its new price",
          "the cost asked for carries each attribute I chose, by its product alone",
          "the cost asked for carries no quantity for the plan itself",
          "I am shown the pro-rata amount the platform priced",
          "I am shown the lines of the invoice the platform priced",
          "I am told the change is not free"
        ])
      ]
    );

    recordChangeScenario(
      "Changing an option of the chosen plan re-prices what the change costs",
      "I have chosen the plan with options and I am shown what the change costs",
      pickSmall,
      [
        [
          "I change the option I chose to the other option of the plan",
          async (generator, { target }) => {
            await readProvisionFields(generator, PLAN_WITH_OPTIONS, [LARGE]);
            expectAnswer(
              await dryRun(generator, target, PLAN_WITH_OPTIONS, [[LARGE, 9]]),
              true,
              "The second dry run"
            );
          }
        ],
        ...quiet([
          "the cost of the change is asked for again without committing it",
          "the cost asked for carries the option I changed to",
          "I am shown the cost the platform priced for my new choice, not the cost before it"
        ])
      ]
    );

    recordChangeScenario(
      "I am told a change of plan to a plan of the same price costs nothing",
      "I have opened a change of plan on a subscription whose plan allows a plan of the same price",
      (generator, { read }) => openOn(generator, read, PLAN_OF_THE_SAME_PRICE),
      [
        [
          "I choose the plan of the same price",
          async (generator, { read, target }) => {
            await loadPlan(read, PLAN_OF_THE_SAME_PRICE)(generator);
            const dry = await dryRun(
              generator,
              target,
              PLAN_OF_THE_SAME_PRICE,
              []
            );
            expectAnswer(dry, true, "The dry run");
            const total = (
              dry.body as { data?: { total_amount_converted?: number } }
            )?.data?.total_amount_converted;
            if (total !== 0)
              throw new Error(`The same-price dry run priced ${total}.`);
          }
        ],
        ...quiet([
          "the cost of the change is asked for without committing it",
          "I am told the change costs nothing"
        ])
      ]
    );

    recordChangeScenario(
      "A choice of options the platform cannot price shows no cost",
      "I have chosen the plan with a required choice and I am shown what the change costs",
      async (generator, row) => {
        await openOn(generator, row.read, PLAN_WITH_A_REQUIRED_CHOICE);
        await loadPlan(row.read, PLAN_WITH_A_REQUIRED_CHOICE)(generator);
        expectAnswer(
          await dryRun(generator, row.target, PLAN_WITH_A_REQUIRED_CHOICE, []),
          false,
          "The dry run of an empty required choice"
        );
        await readProvisionFields(generator, PLAN_WITH_A_REQUIRED_CHOICE, [
          PICK_ONE
        ]);
        expectAnswer(
          await dryRun(generator, row.target, PLAN_WITH_A_REQUIRED_CHOICE, [
            [PICK_ONE, 2]
          ]),
          true,
          "The dry run of one value"
        );
      },
      [
        [
          "I clear the required choice of the plan I chose",
          async (generator, { target }) => {
            await readProvisionFields(generator, PLAN_WITH_A_REQUIRED_CHOICE);
            expectAnswer(
              await dryRun(generator, target, PLAN_WITH_A_REQUIRED_CHOICE, []),
              false,
              "The dry run of a cleared required choice"
            );
          }
        ],
        ...quiet([
          "the cost of the change is asked for again without committing it",
          "I am shown no cost for the change",
          "the change of plan reports no error from the platform",
          "I am told my choice of options is not valid",
          "I am told I can still commit the change"
        ])
      ]
    );

    recordChangeScenario(
      "Change my subscription to the plan I chose",
      "I have chosen the plan with options and I am shown what the change costs",
      pickSmall,
      [
        [
          "I commit the change of plan",
          commitAndReread(PLAN_WITH_OPTIONS, [[SMALL, 3]])
        ],
        ...quiet([
          "the module reports itself busy while the change is in flight",
          "the change is sent without the dry-run flag",
          "the change sent is the one I was shown the cost of",
          "it reports itself settled once the change has landed",
          "I am given the invoice the change raised",
          "I am told what is left to pay on that invoice",
          "I am told I must pay that invoice before the change takes effect",
          "my product is read again",
          "the change of plan is closed",
          "I am still given the invoice the change raised"
        ])
      ]
    );

    recordChangeScenario(
      "A change of plan that costs nothing asks me to pay nothing",
      "I have chosen the plan of the same price and I am told the change costs nothing",
      pickSamePrice,
      [
        [
          "I commit the change of plan",
          commitAndReread(PLAN_OF_THE_SAME_PRICE, [])
        ],
        ...quiet([
          "I am given the invoice the change raised",
          "I am told I do not have to pay for the change to take effect",
          "my product is read again"
        ])
      ]
    );

    recordChangeScenario(
      "A change of plan the platform refuses keeps my choice",
      "I have chosen the plan with options and the platform will refuse that change",
      pickSmall,
      [
        [
          "I commit the change of plan",
          commitAndReread(PLAN_WITH_OPTIONS, [[SMALL, 3]], false)
        ],
        ...quiet([
          "the change of plan reports that the platform refused it",
          "the change of plan stays open on the plan I chose",
          "the option I chose is kept",
          "I am given no invoice"
        ])
      ],
      async ({ target }) => {
        await changeProductOf(target, PRO_RATA_TARGET);
        expectGate(
          await gateRead(target),
          { pro_rata_pending: true },
          "A change of plan the platform refuses keeps my choice"
        );
      }
    );

    recordChangeScenario(
      "The platform judges a change of plan whose choice of options is not valid",
      "I have chosen the plan with a required choice and cleared that choice",
      async (generator, row) => {
        await openOn(generator, row.read, PLAN_WITH_A_REQUIRED_CHOICE);
        await loadPlan(row.read, PLAN_WITH_A_REQUIRED_CHOICE, [PICK_ONE])(
          generator
        );
        await dryRun(generator, row.target, PLAN_WITH_A_REQUIRED_CHOICE, [
          [PICK_ONE, 2]
        ]);
        expectAnswer(
          await dryRun(generator, row.target, PLAN_WITH_A_REQUIRED_CHOICE, []),
          false,
          "The dry run of a cleared required choice"
        );
      },
      [
        [
          "I commit the change of plan",
          commitAndReread(PLAN_WITH_A_REQUIRED_CHOICE, [], false)
        ],
        ...quiet([
          "the change is sent without the dry-run flag",
          "the change of plan reports that the platform refused it",
          "the change of plan stays open on the plan I chose",
          "I am given no invoice"
        ])
      ]
    );

    recordChangeScenario(
      "Close a change of plan without changing",
      "I have chosen the plan with options and I am shown what the change costs",
      pickSmall,
      quiet([
        "I close the change of plan",
        "the change of plan is closed",
        "no plan is configured for a change any more",
        "I am shown no cost for the change",
        "my product is still active"
      ])
    );

    recordChangeScenario(
      "A new change of plan starts with no invoice from the change before",
      "I have chosen the plan of the same price and I am told the change costs nothing",
      pickSamePrice,
      [
        [
          "I have changed my subscription to that plan, which allows a change back",
          async (generator, row) => {
            await commitAndReread(PLAN_OF_THE_SAME_PRICE, [])(generator, row);
            row.read = await gateRead(row.target);
            if (row.read.product?.id !== PLAN_OF_THE_SAME_PRICE)
              throw new Error(
                `After the free change the product reads plan ${row.read.product?.id}.`
              );
            await readCount(row.read)(generator);
          }
        ],
        [
          "I ask to change its plan",
          (generator, { read }) => readPage(read, 1, 0)(generator)
        ],
        ...quiet([
          "the change of plan opens on the plans I can choose from",
          "I am given no invoice from the change before"
        ])
      ]
    );

    for (const [other, write, undo] of [
      [
        "refresh my product",
        (generator: Generator, target: Arranged) =>
          generator.get(PRODUCT_READ_OF(target)),
        async () => undefined
      ],
      [
        "ask for it to stop renewing",
        async (generator: Generator, target: Arranged) => {
          await generator.put(
            `/api/contracts/${target.contractId}/products/${target.cpId}/modify_renew`,
            { renew: false }
          );
          await generator.get(PRODUCT_READ_OF(target));
        },
        (target: Arranged) =>
          asClient(
            "PUT",
            `/api/contracts/${target.contractId}/products/${target.cpId}/modify_renew`,
            { renew: true }
          )
      ],
      [
        'set its consolidation to "opted out"',
        async (generator: Generator, target: Arranged) => {
          await generator.put(
            `/api/contracts/${target.contractId}/products/${target.cpId}/properties`,
            { invoice_consolidation_enabled: 0 }
          );
          await generator.get(PRODUCT_READ_OF(target));
        },
        async () => undefined
      ]
    ] as const)
      recordChangeScenario(
        `Another change to my product closes my open change of plan — ${other}`,
        "I have chosen the plan with options on one of my active subscriptions",
        pickSmall,
        [
          [
            `I ${other}`,
            async (generator, { target }) => {
              await write(generator, target);
              await undo(target);
            }
          ],
          ...quiet([
            "the change of plan is closed",
            "no plan is configured for a change any more"
          ])
        ]
      );

    recordChangeScenario(
      "A plan I chose that did not load can be loaded again",
      "I have chosen a plan to change to and it could not be loaded",
      async (generator, { read }) => {
        await openOn(generator, read, PLAN_WITH_OPTIONS);
        await setForSale(PLAN_WITH_OPTIONS, 0);
        await (async () => {
          const load = await generator.get(
            `/api/basket/products/${PLAN_WITH_OPTIONS}?with=${PLAN_LOAD_WITH}&currency_id=${read.contract?.currency_id}&omit_promotions=1`
          );
          expectAnswer(load, false, "The load of a plan off sale");
          await generator.get(
            `/api/basket/products/${PLAN_WITH_OPTIONS}/provision_fields`
          );
        })().finally(() => setForSale(PLAN_WITH_OPTIONS, 1));
      },
      [
        [
          "I ask for the plan I chose to be loaded again",
          async (generator, { read, target }) => {
            await loadPlan(read, PLAN_WITH_OPTIONS, [SMALL])(generator);
            await dryRun(generator, target, PLAN_WITH_OPTIONS, [[SMALL, 3]]);
          }
        ],
        ...quiet([
          "the plan I chose is loaded again",
          "I am told the plan I chose is ready to configure"
        ])
      ]
    );

    recordChangeScenario(
      "A plan that needs provisioning details can still be changed to",
      "I have chosen a plan that needs provisioning details and I am shown what the change costs",
      pickPriced(PLAN_WITH_PROVISIONING, []),
      [
        [
          "I commit the change of plan",
          commitAndReread(PLAN_WITH_PROVISIONING, [])
        ],
        ...quiet([
          "the change is sent without the dry-run flag",
          "the change sent carries no provisioning details",
          "I am given the invoice the change raised"
        ])
      ]
    );
  });
});
