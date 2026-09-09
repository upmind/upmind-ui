// -----------------------------------------------------------------------------
/**
 * @module tests/vault-forms
 * @description Gap doc §4 "Notes & secrets" / plan §3 row "Vault note / secret
 * add / edit": the two forms legacy's `vaultNoteForm` and `vaultSecretForm`
 * carried, opened from the account's own pair of panels and from a product's
 * (plan F12). The shell mounts ONE dialog, so a create carries the scope it
 * lands in on its own verb (`mock/actions.ts`'s vault grammar) while an edit
 * carries the row, which holds its scope and its note/secret axis already.
 * `vault.test.ts` grades what a row says; this grades adding and editing one.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { rowBinding, stringsIn } from "./support/page-config";
import { cloneDeep, filter, find, map, some } from "lodash-es";
import type { DataRefId } from "~/portal/mock/data-refs";
import type { DataRouteContext } from "~/portal/mock/injection";
import type {
  MockDataset,
  MockProduct,
  MockVaultAsset
} from "~/portal/mock/types";
import { accountPages } from "~/portal/config/account-pages";
import { productPages } from "~/portal/config/product-pages";
import {
  MOCK_ACTION,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import { ClientVaultContextTypes } from "~/portal/mock/contracts/client-vault";
import * as vaultSchemas from "~/portal/mock/contracts/client-vault.schemas";
import {
  DATA_REF_ID,
  dataRef,
  resolveDataRefProps
} from "~/portal/mock/data-refs";
import { usePortalAjv } from "~/portal/mock/forms/ajv";
import { FORM_ID } from "~/portal/mock/forms/ids";
import { resolveMockForm } from "~/portal/mock/forms/registry";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { PAGE_KEY } from "~/portal/types";

const NO_CONTEXT: DataRouteContext = {};

const OVERVIEW_PAGE = "product-area/overview";

const EDIT_LABEL = "Edit";

const NOTE = { label: "Registrar handover", value: "Ask for the auth code." };

const SECRET = { label: "Panel recovery key", value: "KE-8821-ROWAN" };

const RENAMED = {
  label: "Registrar handover 2027",
  value: "Auth code on file."
};

type ActionLike = { readonly value: string; readonly label: string };

type RowLike = { readonly id: string; readonly moreActions?: ActionLike[] };

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function ref<T>(
  data: MockDataset,
  id: DataRefId,
  context: DataRouteContext = {}
): T {
  return resolveDataRefProps({ value: dataRef(id) }, data, context)?.value as T;
}

function contextFor(product: MockProduct): DataRouteContext {
  return { groupSlug: product.groupSlug, productId: product.id };
}

function seededProduct(
  data: MockDataset,
  matches: (product: MockProduct) => boolean = () => true
): MockProduct {
  const product = find(data.products, matches);
  if (product === undefined) throw new Error("seed carries no product");
  return product;
}

function seededAsset(
  data: MockDataset,
  trait: string,
  matches: (asset: MockVaultAsset) => boolean
): MockVaultAsset {
  const asset = find(data.vault, matches);
  if (asset === undefined) throw new Error(`seed carries no ${trait}`);
  return asset;
}

function createValue(action: string, productId?: string): string {
  if (productId === undefined)
    return mockActionValue(MOCK_ACTION.OPEN_FORM, action);
  return mockActionValue(MOCK_ACTION.OPEN_FORM, `${action}:${productId}`);
}

function submit(verb: string, scope: string, model: unknown): string {
  return `${verb}:${scope}:${JSON.stringify(model)}`;
}

describe("both pairs of panels offer the way to add one", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("names no entity on the account's own panels", () => {
    const data = hostgrid();
    const page = accountPages()[PAGE_KEY.ACCOUNT_NOTES];

    expect(
      stringsIn(rowBinding(page, DATA_REF_ID.ACCOUNT_NOTE_ITEMS))
    ).toContain(DATA_REF_ID.ACCOUNT_NOTE_ACTIONS);
    expect(
      stringsIn(rowBinding(page, DATA_REF_ID.ACCOUNT_SECRET_ITEMS))
    ).toContain(DATA_REF_ID.ACCOUNT_SECRET_ACTIONS);
    expect(
      map(ref<ActionLike[]>(data, DATA_REF_ID.ACCOUNT_NOTE_ACTIONS), "value")
    ).toEqual([createValue(FORM_ID.VAULT_NOTE_CREATE)]);
    expect(
      map(ref<ActionLike[]>(data, DATA_REF_ID.ACCOUNT_SECRET_ACTIONS), "value")
    ).toEqual([createValue(FORM_ID.VAULT_SECRET_CREATE)]);
  });

  it("names the product a product's own panels stand on", () => {
    const data = hostgrid();
    const product = seededProduct(data);
    const page = productPages()[OVERVIEW_PAGE];

    expect(
      stringsIn(rowBinding(page, DATA_REF_ID.PRODUCT_NOTE_ITEMS))
    ).toContain(DATA_REF_ID.PRODUCT_NOTE_ACTIONS);
    expect(
      stringsIn(rowBinding(page, DATA_REF_ID.PRODUCT_SECRET_ITEMS))
    ).toContain(DATA_REF_ID.PRODUCT_SECRET_ACTIONS);
    expect(
      map(
        ref<ActionLike[]>(
          data,
          DATA_REF_ID.PRODUCT_NOTE_ACTIONS,
          contextFor(product)
        ),
        "value"
      )
    ).toEqual([createValue(FORM_ID.VAULT_NOTE_CREATE, product.id)]);
    expect(
      map(
        ref<ActionLike[]>(
          data,
          DATA_REF_ID.PRODUCT_SECRET_ACTIONS,
          contextFor(product)
        ),
        "value"
      )
    ).toEqual([createValue(FORM_ID.VAULT_SECRET_CREATE, product.id)]);
  });

  it("carries the scope it lands in on the verb the form submits", () => {
    const data = hostgrid();
    const product = seededProduct(data);

    expect(
      resolveMockForm(data, FORM_ID.VAULT_NOTE_CREATE, undefined)?.submit
    ).toBe(
      `${MOCK_ACTION.VAULT_NOTE_CREATE}:${ClientVaultContextTypes.CLIENT}`
    );
    expect(
      resolveMockForm(data, FORM_ID.VAULT_SECRET_CREATE, product.id)?.submit
    ).toBe(
      `${MOCK_ACTION.VAULT_SECRET_CREATE}:${ClientVaultContextTypes.CONTRACT_PRODUCT}:${product.id}`
    );
    expect(
      resolveMockForm(data, FORM_ID.VAULT_NOTE_CREATE, undefined)?.model
    ).toEqual(vaultSchemas.vaultDefaults());
    expect(
      resolveMockForm(data, FORM_ID.VAULT_SECRET_CREATE, product.id)?.schema
    ).toEqual(vaultSchemas.useSecretSchema());
  });
});

describe("adding one", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("attaches an account note to the account and to no product", () => {
    const data = hostgrid();
    const before = data.vault.length;

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      submit(
        MOCK_ACTION.VAULT_NOTE_CREATE,
        ClientVaultContextTypes.CLIENT,
        NOTE
      )
    );

    const added = find(data.vault, { label: NOTE.label });
    expect(data.vault.length).toBe(before + 1);
    expect(added?.note).toBe(NOTE.value);
    expect(added?.encrypted).toBe(false);
    expect(added?.contract_product_id).toBeNull();
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
  });

  it("attaches a product secret to that product, and stands on its panel alone", () => {
    const data = hostgrid();
    const product = seededProduct(data);
    const other = seededProduct(data, item =>
      some(data.vault, { contract_product_id: item.id })
    );

    dispatchMockAction(
      data,
      NO_CONTEXT,
      submit(
        MOCK_ACTION.VAULT_SECRET_CREATE,
        `${ClientVaultContextTypes.CONTRACT_PRODUCT}:${product.id}`,
        SECRET
      )
    );

    const added = find(data.vault, { label: SECRET.label });
    const elsewhereSecrets = map(
      ref<RowLike[]>(data, DATA_REF_ID.PRODUCT_SECRET_ITEMS, contextFor(other)),
      "id"
    );
    const elsewhereNotes = map(
      ref<RowLike[]>(data, DATA_REF_ID.PRODUCT_NOTE_ITEMS, contextFor(other)),
      "id"
    );

    expect(added?.encrypted).toBe(true);
    expect(added?.contract_product_id).toBe(product.id);
    expect(
      map(
        ref<RowLike[]>(
          data,
          DATA_REF_ID.PRODUCT_SECRET_ITEMS,
          contextFor(product)
        ),
        "id"
      )
    ).toContain(added?.id);
    expect(elsewhereSecrets.length).toBeGreaterThan(0);
    expect(elsewhereSecrets).not.toContain(added?.id);
    expect(elsewhereNotes.length).toBeGreaterThan(0);
    expect(elsewhereNotes).not.toContain(added?.id);
  });

  it("insists on a value on both sides of the axis", () => {
    const note = usePortalAjv().compile(vaultSchemas.useNoteSchema());
    const secret = usePortalAjv().compile(vaultSchemas.useSecretSchema());

    expect(secret(SECRET)).toBe(true);
    expect(secret({ label: SECRET.label })).toBe(false);
    expect(secret({ label: SECRET.label, value: "" })).toBe(false);
    expect(secret({ value: SECRET.value })).toBe(false);
    expect(note(NOTE)).toBe(true);
    expect(note({ label: NOTE.label })).toBe(false);
  });

  it("says nothing at all to a scope this layer never authored", () => {
    const data = hostgrid();
    const before = cloneDeep(data.vault);

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      submit(MOCK_ACTION.VAULT_NOTE_CREATE, "sideways", NOTE)
    );

    expect(result).toBeUndefined();
    expect(data.vault).toEqual(before);
  });
});

describe("editing one", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("is offered on every row, on the side of the axis that row is on", () => {
    const data = hostgrid();
    const notes = ref<RowLike[]>(data, DATA_REF_ID.ACCOUNT_NOTE_ITEMS);
    const secrets = ref<RowLike[]>(data, DATA_REF_ID.ACCOUNT_SECRET_ITEMS);

    expect(notes.length).toBeGreaterThan(0);
    expect(secrets.length).toBeGreaterThan(0);
    for (const row of notes) {
      expect(find(row.moreActions, { label: EDIT_LABEL })?.value).toBe(
        mockActionValue(
          MOCK_ACTION.OPEN_FORM,
          `${FORM_ID.VAULT_NOTE_UPDATE}:${row.id}`
        )
      );
    }
    for (const row of secrets) {
      expect(find(row.moreActions, { label: EDIT_LABEL })?.value).toBe(
        mockActionValue(
          MOCK_ACTION.OPEN_FORM,
          `${FORM_ID.VAULT_SECRET_UPDATE}:${row.id}`
        )
      );
    }
  });

  it("writes over the row in place, keeping its scope and its kind", () => {
    const data = hostgrid();
    const asset = seededAsset(
      data,
      "product-scoped note",
      candidate =>
        !candidate.encrypted && candidate.contract_product_id !== null
    );
    const before = data.vault.length;

    const entry = resolveMockForm(data, FORM_ID.VAULT_NOTE_UPDATE, asset.id);
    expect(entry?.model).toEqual({ label: asset.label, value: asset.note });
    expect(entry?.submit).toBe(`${MOCK_ACTION.VAULT_NOTE_UPDATE}:${asset.id}`);

    const result = dispatchMockAction(
      data,
      NO_CONTEXT,
      `${MOCK_ACTION.VAULT_NOTE_UPDATE}:${asset.id}:${JSON.stringify(RENAMED)}`
    );

    const saved = find(data.vault, { id: asset.id });
    expect(result?.toast?.intent).toBe(MOCK_TOAST_INTENT.SUCCESS);
    expect(data.vault.length).toBe(before);
    expect(saved?.label).toBe(RENAMED.label);
    expect(saved?.note).toBe(RENAMED.value);
    expect(saved?.encrypted).toBe(asset.encrypted);
    expect(saved?.contract_product_id).toBe(asset.contract_product_id);
    expect(
      some(
        filter(data.vault, { label: RENAMED.label }),
        row => row.id !== asset.id
      )
    ).toBe(false);
  });
});
