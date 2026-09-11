// -----------------------------------------------------------------------------
/**
 * @module tests/vault
 * @description Gap doc §2 Overview and §4 "Notes & secrets": one vault, two
 * scopes and two kinds. A product's panels show that product's rows and
 * nobody else's; the account page shows the account-wide rows split into
 * notes and secrets, with the secrets masked. Deleting asks first and deletes
 * nothing until it is answered; converting moves a row between the two panels
 * without moving it in the vault.
 *
 * The gate is graded on a clone that KEEPS its rows and switches the config
 * key off — the shipped OFF dataset seeds an empty vault, so it could only
 * ever prove that nothing is nothing.
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  boundRefId,
  propsBinding,
  rowBinding,
  stringsIn
} from "./support/page-config";
import {
  assign,
  every,
  filter,
  find,
  findIndex,
  includes,
  map
} from "lodash-es";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockDataset, MockVaultAsset } from "~/portal/mock/types";
import { productPages } from "~/portal/config/product-pages";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import { DATA_REF_ID } from "~/portal/mock/data-refs";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { HOSTGRID_MINIMAL_MOCK_DATASET } from "~/portal/mock/hostgrid-minimal";
import {
  accountNoteItems,
  accountSecretItems,
  areNotesEnabled,
  productNoteItems,
  productSecretItems
} from "~/portal/mock/selectors";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { PAGE_KEY } from "~/portal/types";

const PRODUCT_ID = "prod-analytics";
const OTHER_PRODUCT_ID = "prod-mail";
const CONTEXT: DataRouteContext = {
  groupSlug: "products",
  productId: PRODUCT_ID
};
const NO_CONTEXT: DataRouteContext = {};

/** Legacy's product overview listed three notes and linked out for the rest. */
const VISIBLE_NOTES = 3;

const REFUSAL_INTENTS = [MOCK_TOAST_INTENT.WARNING, MOCK_TOAST_INTENT.ERROR];

function asset(
  data: MockDataset,
  encrypted: boolean,
  productId: string | null
): MockVaultAsset {
  const row = find(data.vault, {
    encrypted,
    contract_product_id: productId
  });
  if (row === undefined) throw new Error("seed carries no such vault row");
  return row;
}

function gateOff(): MockDataset {
  const dataset: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
  return assign(dataset, {
    features: assign({}, dataset.features, {
      CLIENT_NOTES_AND_SECRETS_ENABLED: false
    })
  });
}

describe("product panels — this product's notes and secrets, and nobody else's", () => {
  const data = HOSTGRID_MOCK_DATASET;

  it("lists only the notes scoped to the product in the route", () => {
    const items = productNoteItems(data, CONTEXT);
    const owned = filter(data.vault, {
      contract_product_id: PRODUCT_ID,
      encrypted: false
    });

    expect(owned.length).toBeGreaterThan(0);
    expect(map(items, "id")).toEqual(map(owned, "id"));
    expect(map(items, "title")).toEqual(map(owned, "label"));
  });

  it("lists only the secrets scoped to that product, each masked", () => {
    const items = productSecretItems(data, CONTEXT);
    const owned = filter(data.vault, {
      contract_product_id: PRODUCT_ID,
      encrypted: true
    });

    expect(owned.length).toBeGreaterThan(0);
    expect(map(items, "id")).toEqual(map(owned, "id"));
    expect(every(items, { secret: true })).toBe(true);
  });

  it("shows another product's rows nowhere, and the account's rows nowhere either", () => {
    const shown = map(
      [
        ...productNoteItems(data, CONTEXT),
        ...productSecretItems(data, CONTEXT)
      ],
      "id"
    );
    const elsewhere = map(
      filter(data.vault, row => row.contract_product_id !== PRODUCT_ID),
      "id"
    );

    expect(elsewhere.length).toBeGreaterThan(0);
    expect(every(elsewhere, id => !includes(shown, id))).toBe(true);
  });

  it("a product with no vault rows of its own shows empty panels", () => {
    const context: DataRouteContext = { productId: OTHER_PRODUCT_ID };

    expect(
      filter(data.vault, { contract_product_id: OTHER_PRODUCT_ID })
    ).toEqual([]);
    expect(productNoteItems(data, context)).toEqual([]);
    expect(productSecretItems(data, context)).toEqual([]);
  });

  it("shows three notes on the panel and sends the client to the full list for the rest", () => {
    const page = productPages()[PAGE_KEY.PRODUCT_DETAIL];
    const props = propsBinding(page, DATA_REF_ID.PRODUCT_NOTE_ITEMS);
    const row = rowBinding(page, DATA_REF_ID.PRODUCT_NOTE_ITEMS);

    expect(props?.maxItems).toBe(VISIBLE_NOTES);
    expect(stringsIn(row)).toEqual(
      expect.arrayContaining([expect.stringMatching(/view all/i)])
    );
  });
});

describe("account page — the account-wide rows, split by kind", () => {
  const data = HOSTGRID_MOCK_DATASET;

  it("carries account notes only — never a note that belongs to a product", () => {
    const items = accountNoteItems(data);
    const ids = map(items, "id");

    expect(items.length).toBeGreaterThan(0);
    expect(
      every(ids, id => find(data.vault, { id })?.contract_product_id === null)
    ).toBe(true);
    expect(
      every(ids, id => find(data.vault, { id })?.encrypted === false)
    ).toBe(true);
    expect(ids).toContain(asset(data, false, null).id);
  });

  it("carries account secrets only, and every one of them is masked", () => {
    const items = accountSecretItems(data);
    const ids = map(items, "id");

    expect(items.length).toBeGreaterThan(0);
    expect(
      every(ids, id => find(data.vault, { id })?.contract_product_id === null)
    ).toBe(true);
    expect(every(items, { secret: true })).toBe(true);
    expect(ids).toContain(asset(data, true, null).id);
  });

  it("keeps the two kinds apart — no row appears on both panels", () => {
    const notes = map(accountNoteItems(data), "id");
    const secrets = map(accountSecretItems(data), "id");

    expect(every(notes, id => !includes(secrets, id))).toBe(true);
  });
});

describe("the notes-and-secrets gate — off means nothing shows, rows or no rows", () => {
  it("reads the brand's own config key, not whether the vault happens to be empty", () => {
    const data = gateOff();

    expect(data.vault.length).toBeGreaterThan(0);
    expect(areNotesEnabled(data)).toBe(false);
  });

  it("is the gate both panels hang their visibility on", () => {
    const page = productPages()[PAGE_KEY.PRODUCT_DETAIL];

    for (const ref of [
      DATA_REF_ID.PRODUCT_NOTE_ITEMS,
      DATA_REF_ID.PRODUCT_SECRET_ITEMS
    ]) {
      expect({
        ref,
        visible: boundRefId(rowBinding(page, ref), "visible")
      }).toEqual({ ref, visible: DATA_REF_ID.ARE_NOTES_ENABLED });
    }
  });

  it("is on for the brand that ships the panels and off for the one that does not", () => {
    expect(areNotesEnabled(HOSTGRID_MOCK_DATASET)).toBe(true);
    expect(
      HOSTGRID_MINIMAL_MOCK_DATASET.features.CLIENT_NOTES_AND_SECRETS_ENABLED
    ).toBe(false);
    expect(areNotesEnabled(HOSTGRID_MINIMAL_MOCK_DATASET)).toBe(false);
  });
});

describe("vault actions — deleting asks first, converting moves nothing", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("asks before deleting, and deletes nothing while it is asking", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const row = asset(data, false, null);
    const before = data.vault.length;

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      mockActionValue(MOCK_ACTION.VAULT_REMOVE, row.id)
    );

    expect(result?.confirm?.destructive).toBe(true);
    expect(result?.confirm?.actionLabel).toBeTruthy();
    expect(result?.confirm?.then).toBeTruthy();
    expect(map(data.vault, "id")).toContain(row.id);
    expect(data.vault).toHaveLength(before);
  });

  it("deletes the row the answered confirmation named, and only that one", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const row = asset(data, false, null);
    const before = data.vault.length;
    const asked = dispatchMockAction(
      data,
      NO_CONTEXT,
      mockActionValue(MOCK_ACTION.VAULT_REMOVE, row.id)
    );

    const confirmed = dispatchMockAction(
      data,
      NO_CONTEXT,
      asked?.confirm?.then ?? ""
    );

    expect(map(data.vault, "id")).not.toContain(row.id);
    expect(data.vault).toHaveLength(before - 1);
    expect(confirmed?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(map(accountNoteItems(data), "id")).not.toContain(row.id);
  });

  it("turns a note into a secret where it stands", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const row = asset(data, false, null);
    const position = findIndex(data.vault, { id: row.id });

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      mockActionValue(MOCK_ACTION.VAULT_CONVERT, row.id)
    );

    expect(find(data.vault, { id: row.id })?.encrypted).toBe(true);
    expect(find(data.vault, { id: row.id })?.label).toBe(row.label);
    expect(findIndex(data.vault, { id: row.id })).toBe(position);
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(map(accountSecretItems(data), "id")).toContain(row.id);
  });

  it("turns a secret back into a note the same way", () => {
    const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
    const row = asset(data, true, null);

    dispatchMockAction(
      data,
      NO_CONTEXT,
      mockActionValue(MOCK_ACTION.VAULT_CONVERT, row.id)
    );

    expect(find(data.vault, { id: row.id })?.encrypted).toBe(false);
    expect(map(accountNoteItems(data), "id")).toContain(row.id);
  });

  it.each([MOCK_ACTION.VAULT_REMOVE, MOCK_ACTION.VAULT_CONVERT])(
    "%s never raises a dialog for a row the client does not hold, and changes nothing",
    action => {
      const data = useMockData(MOCK_DATASET_ID.HOSTGRID);
      const before = map(data.vault, "id");

      const result = dispatchMockAction(
        data,
        NO_CONTEXT,
        mockActionValue(action, "no-such-row")
      );

      expect(result?.confirm).toBeUndefined();
      expect(map(data.vault, "id")).toEqual(before);
    }
  );

  it.each([MOCK_ACTION.VAULT_REMOVE, MOCK_ACTION.VAULT_CONVERT])(
    "%s tells the client when the row it named is not there (plan R4)",
    action => {
      const data = useMockData(MOCK_DATASET_ID.HOSTGRID);

      const result = dispatchMockAction(
        data,
        NO_CONTEXT,
        mockActionValue(action, "no-such-row")
      );

      expect(includes(REFUSAL_INTENTS, result?.toast?.intent)).toBe(true);
    }
  );
});
