// -----------------------------------------------------------------------------
/**
 * Legacy's profile page manages four contact lists under the profile form:
 * emails, phones, and the "Address and company details" section holding both
 * kinds of billable entity. No client-vue component serves that page, so the
 * sandbox mocks all four. Oracle: vue-app 1.74.0,
 * `views/client/account/profile/index.vue` and the `client/*` components.
 */
import { beforeEach, describe, expect, it } from "vitest";
import { rowBinding, stringsIn } from "./support/page-config";
import { filter, find, get, includes, map } from "lodash-es";
import type { MockDataset } from "~/portal/mock/types";
import { accountPages } from "~/portal/config/account-pages";
import { CLIENT_VUE_STUB_TITLE } from "~/portal/config/client-vue";
import {
  MOCK_ACTION,
  MOCK_REFUSAL_MESSAGE,
  MOCK_TOAST_INTENT,
  dispatchMockAction,
  mockActionValue
} from "~/portal/mock/actions";
import {
  BILLABLE_ENTITY_KIND,
  billableEntitiesCollection
} from "~/portal/mock/collection-defs";
import { DATA_REF_ID, dataRef, resolveDataRef } from "~/portal/mock/data-refs";
import { MOCK_RECEIPT_REASON } from "~/portal/mock/facades/facade";
import {
  useMockClientAddresses,
  useMockClientCompanies,
  useMockClientPhones
} from "~/portal/mock/facades/useMockContacts";
import { FORM_ID } from "~/portal/mock/forms/ids";
import { resolveMockForm } from "~/portal/mock/forms/registry";
import {
  MOCK_DATASET_ID,
  resetMockData,
  useMockData
} from "~/portal/mock/store";
import { MOCK_ADDRESS_TYPE } from "~/portal/mock/types";
import { PAGE_KEY } from "~/portal/types";

type ActionLike = { readonly value: string; readonly label: string };
type ItemLike = {
  readonly id: string;
  readonly title: string;
  readonly tags?: readonly { readonly label: string }[];
  readonly action?: ActionLike;
  readonly moreActions?: readonly ActionLike[];
};

function hostgrid(): MockDataset {
  return useMockData(MOCK_DATASET_ID.HOSTGRID);
}

function items(
  data: MockDataset,
  id: (typeof DATA_REF_ID)[keyof typeof DATA_REF_ID]
): ItemLike[] {
  return resolveDataRef(dataRef(id), data, {}) as ItemLike[];
}

function labels(item: ItemLike | undefined): string[] {
  return map(item?.moreActions ?? [], "label");
}

function formValue(verb: string, model: unknown, entityId?: string): string {
  if (entityId === undefined) return `${verb}:${JSON.stringify(model)}`;
  return `${verb}:${entityId}:${JSON.stringify(model)}`;
}

const NEW_ADDRESS = {
  name: "Warehouse",
  type: MOCK_ADDRESS_TYPE.OFFICE,
  address: {
    address1: "9 Dock Road",
    address2: null,
    city: "Liverpool",
    postcode: "L3 4AA",
    regionId: null,
    countryId: "GB"
  }
};

describe("the profile page's contact lists (legacy clientEmailsComp, clientPhonesComp, billableEntitiesComp)", () => {
  beforeEach(() => {
    resetMockData(MOCK_DATASET_ID.HOSTGRID);
  });

  it("mounts three list panels under the profile form and no client-vue stub", () => {
    const page = accountPages()[PAGE_KEY.ACCOUNT_PROFILE];
    expect(includes(stringsIn(page), CLIENT_VUE_STUB_TITLE)).toBe(false);
    for (const [refId, title] of [
      [DATA_REF_ID.PROFILE_EMAIL_ITEMS, "Emails"],
      [DATA_REF_ID.PROFILE_PHONE_ITEMS, "Phones"],
      [DATA_REF_ID.BILLABLE_ENTITY_ITEMS, "Address and company details"]
    ] as const) {
      const row = rowBinding(page, refId);
      expect(get(row, "header.title")).toBe(title);
      expect(row?.header).toHaveProperty("actions");
    }
  });

  it("gives every add and edit modal a registered form", () => {
    const data = hostgrid();
    const email = data.emails[0]?.id ?? "";
    const phone = data.phones[0]?.id ?? "";
    const address = data.addresses[0]?.id ?? "";
    const company = data.companies[0]?.id ?? "";
    for (const [id, entity] of [
      [FORM_ID.EMAIL_CREATE, undefined],
      [FORM_ID.EMAIL_EDIT, email],
      [FORM_ID.PHONE_CREATE, undefined],
      [FORM_ID.PHONE_EDIT, phone],
      [FORM_ID.ADDRESS_CREATE, undefined],
      [FORM_ID.ADDRESS_EDIT, address],
      [FORM_ID.COMPANY_CREATE, undefined],
      [FORM_ID.COMPANY_EDIT, company]
    ] as const) {
      expect(resolveMockForm(data, id, entity), id).toBeDefined();
    }
    // The company form opens on the company's own address-book row.
    const edited = resolveMockForm(data, FORM_ID.COMPANY_EDIT, company);
    expect(get(edited, "model.address.postcode")).toBe("EC1V 4AB");
  });

  describe("emails (legacy clientEmailRow)", () => {
    it("tags the default and the unverified address and offers legacy's menu", () => {
      const rows = items(hostgrid(), DATA_REF_ID.PROFILE_EMAIL_ITEMS);
      const signIn = find(rows, { id: "eml-addr-1" });
      expect(map(signIn?.tags, "label")).toEqual(["Default", "Unverified"]);
      expect(signIn?.action?.label).toBe("Edit");
      expect(labels(signIn)).toEqual([
        "Copy to clipboard",
        "Resend verification email",
        "Enter verification code",
        "Delete email"
      ]);
      const other = find(rows, row => row.id !== "eml-addr-1");
      expect(labels(other)).toContain("Set as default email");
      // The code prompt belongs to the unconfirmed sign-in address alone.
      expect(labels(other)).not.toContain("Enter verification code");
    });

    it("adds an address through the form, unverified, and lands a toast", () => {
      const data = hostgrid();
      const before = data.emails.length;
      const result = dispatchMockAction(
        data,
        {},
        formValue(MOCK_ACTION.EMAIL_CREATE, { email: "qa@fieldnotes.app" })
      );
      expect(result).toMatchObject({
        formDone: true,
        toast: { intent: MOCK_TOAST_INTENT.SUCCESS, title: "Email added" }
      });
      expect(data.emails.length).toBe(before + 1);
      expect(
        find(data.emails, { email: "qa@fieldnotes.app" })?.meta
      ).toMatchObject({ isDefault: false, isVerified: false });
    });

    it("refuses to delete the default address outright, and confirms the rest", () => {
      const data = hostgrid();
      const refused = dispatchMockAction(
        data,
        {},
        mockActionValue(MOCK_ACTION.EMAIL_REMOVE, "eml-addr-1")
      );
      expect(stringsIn(refused)).toContain(
        MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.DEFAULT_CONTACT]
      );
      const deletable = find(data.emails, row => row.meta.canDelete);
      const asked = dispatchMockAction(
        data,
        {},
        mockActionValue(MOCK_ACTION.EMAIL_REMOVE, deletable?.id ?? "")
      );
      expect(get(asked, "confirm.then")).toBe(
        mockActionValue(MOCK_ACTION.EMAIL_REMOVE_CONFIRMED, deletable?.id ?? "")
      );
      dispatchMockAction(data, {}, get(asked, "confirm.then") ?? "");
      expect(find(data.emails, { id: deletable?.id })).toBeUndefined();
    });

    it("verifies the sign-in address on a six-digit code and refuses any other", () => {
      const data = hostgrid();
      const bad = dispatchMockAction(
        data,
        {},
        formValue(MOCK_ACTION.EMAIL_VERIFY_CODE, { code: "12ab" }, "eml-addr-1")
      );
      expect(stringsIn(bad)).toContain(
        MOCK_REFUSAL_MESSAGE[MOCK_RECEIPT_REASON.INVALID_VERIFICATION_CODE]
      );
      const good = dispatchMockAction(
        data,
        {},
        formValue(
          MOCK_ACTION.EMAIL_VERIFY_CODE,
          { code: "123456" },
          "eml-addr-1"
        )
      );
      expect(good).toMatchObject({ formDone: true });
      expect(find(data.emails, { id: "eml-addr-1" })?.meta.isVerified).toBe(
        true
      );
      // Once verified, the code prompt has nothing to ask.
      expect(
        resolveMockForm(data, FORM_ID.EMAIL_VERIFY_CODE, "eml-addr-1")
      ).toBeUndefined();
    });
  });

  describe("phones (legacy clientPhoneRow)", () => {
    it("lists numbers with the default tagged and legacy's two menu items", () => {
      const rows = items(hostgrid(), DATA_REF_ID.PROFILE_PHONE_ITEMS);
      const home = find(rows, { id: "tel-1" });
      expect(map(home?.tags, "label")).toEqual(["Default"]);
      expect(labels(home)).toEqual(["Delete phone"]);
      const other = find(rows, row => row.id !== "tel-1");
      expect(labels(other)).toEqual(["Set as default phone", "Delete phone"]);
    });

    it("adds, edits, promotes and removes a number through the writes", () => {
      const data = hostgrid();
      const { writes } = useMockClientPhones(data).useActions();
      const added = writes.update(undefined, { phone: "+44 7700 900555" });
      expect(added?.ok).toBe(true);
      const id = added?.entity?.id ?? "";
      expect(find(data.phones, { id })?.phone).toMatchObject({
        number: "+447700900555",
        countryCallingCode: "44",
        country: "GB"
      });
      // Two spellings of one number are one number.
      expect(
        writes.update(undefined, { phone: "+447700900555" })
      ).toMatchObject({
        ok: false,
        reason: MOCK_RECEIPT_REASON.DUPLICATE_CONTACT
      });
      expect(writes.update(id, { phone: "+44 7700 900556" })?.ok).toBe(true);
      expect(writes.setDefault(id)?.ok).toBe(true);
      expect(find(data.phones, { id: "tel-1" })?.meta.isDefault).toBe(false);
      expect(writes.remove(id)).toMatchObject({
        ok: false,
        reason: MOCK_RECEIPT_REASON.DEFAULT_CONTACT
      });
      expect(writes.setDefault("tel-1")?.ok).toBe(true);
      expect(writes.remove(id)?.ok).toBe(true);
      expect(find(data.phones, { id })).toBeUndefined();
    });
  });

  describe("address and company details (legacy billableEntities)", () => {
    it("lists both kinds in one searchable section, each with its own menu", () => {
      const data = hostgrid();
      const rows = items(data, DATA_REF_ID.BILLABLE_ENTITY_ITEMS);
      expect(rows.length).toBe(data.addresses.length + data.companies.length);
      const hq = find(rows, { id: "addr-hq" });
      expect(map(hq?.tags, "label")).toEqual(["Default address"]);
      expect(labels(hq)).toEqual(["Copy to clipboard", "Delete address"]);
      const company = find(rows, { id: "co-kestrel" });
      expect(labels(company)).toEqual([
        "Copy to clipboard",
        "Set as default company",
        "Delete company"
      ]);
      expect(labels(company)).not.toContain("Validate tax number");

      const actions = resolveDataRef(
        dataRef(DATA_REF_ID.BILLABLE_ENTITY_ACTIONS),
        data,
        {}
      ) as ActionLike[];
      expect(map(actions, "label")).toEqual([
        "Add new address",
        "Add new company details"
      ]);

      const { search } = billableEntitiesCollection
        .resolve(data, {})
        .useActions();
      search("Kestrel");
      const found = billableEntitiesCollection.resolve(data, {}).useContext();
      // "Kestrel" is in the head office's street and in both companies.
      expect(map(found.data.value, "id").sort()).toEqual([
        "addr-hq",
        "co-fieldnotes",
        "co-kestrel"
      ]);
      expect(map(found.data.value, "kind")).toContain(
        BILLABLE_ENTITY_KIND.COMPANY
      );
    });

    it("adds an address with its country named and promotes it", () => {
      const data = hostgrid();
      const { writes } = useMockClientAddresses(data).useActions();
      const added = writes.update(undefined, NEW_ADDRESS);
      expect(added?.entity).toMatchObject({
        name: "Warehouse",
        title: "Warehouse",
        description: "9 Dock Road, Liverpool L3 4AA",
        countryName: "United Kingdom",
        type: MOCK_ADDRESS_TYPE.OFFICE,
        meta: { isDefault: false, canDelete: true }
      });
      const id = added?.entity?.id ?? "";
      expect(writes.setDefault(id)?.ok).toBe(true);
      expect(find(data.addresses, { id: "addr-hq" })?.meta.isDefault).toBe(
        false
      );
    });

    it("adds a company with its own address-book row and keeps both default flags in step", () => {
      const data = hostgrid();
      const addressesBefore = data.addresses.length;
      const result = dispatchMockAction(
        data,
        {},
        formValue(MOCK_ACTION.COMPANY_CREATE, {
          name: "Dock Supplies Ltd",
          regNumber: "09876543",
          tax: { number: "GB 123 4567 89" },
          address: NEW_ADDRESS.address
        })
      );
      expect(result).toMatchObject({
        formDone: true,
        toast: { title: "Company added", description: "Dock Supplies Ltd" }
      });
      const company = find(data.companies, { name: "Dock Supplies Ltd" });
      expect(company?.tax).toMatchObject({
        number: "GB 123 4567 89",
        valid: 0
      });
      expect(company?.meta).toMatchObject({ hasTax: true, hasValidTax: false });
      expect(data.addresses.length).toBe(addressesBefore + 1);
      expect(find(data.addresses, { id: company?.addressId })).toMatchObject({
        name: "Dock Supplies Ltd",
        type: MOCK_ADDRESS_TYPE.COMPANY
      });

      const { writes } = useMockClientCompanies(data).useActions();
      expect(writes.setDefault(company?.id ?? "")?.ok).toBe(true);
      const former = find(data.companies, { id: "co-fieldnotes" });
      expect([former?.default, former?.meta.isDefault]).toEqual([false, false]);
      expect([company?.default, company?.meta.isDefault]).toEqual([true, true]);
    });

    it("sends the product's add-address and add-company doors to the same forms", () => {
      const data = hostgrid();
      const product = find(data.products, { id: "prod-analytics" });
      const context = { groupSlug: product?.groupSlug, productId: product?.id };
      const addresses = resolveDataRef(
        dataRef(DATA_REF_ID.PRODUCT_ADDRESS_ITEMS),
        data,
        context
      ) as ItemLike[];
      const companies = resolveDataRef(
        dataRef(DATA_REF_ID.PRODUCT_COMPANY_ITEMS),
        data,
        context
      ) as ItemLike[];
      expect(find(addresses, { id: "add-address" })?.action?.value).toBe(
        mockActionValue(MOCK_ACTION.OPEN_FORM, FORM_ID.ADDRESS_CREATE)
      );
      expect(find(companies, { id: "add-company" })?.action?.value).toBe(
        mockActionValue(MOCK_ACTION.OPEN_FORM, FORM_ID.COMPANY_CREATE)
      );
      expect(
        filter(stringsIn(companies), s => includes(s, "client-vue"))
      ).toEqual([]);
    });
  });
});
