/**
 * @fileoverview Billing tab resolve handlers (FE-3274)
 *
 * ## Job To Be Done
 * When a shopper saves an address, company or phone in a billing tab, the
 * saved id reaches the billing model and the basket at once, even when the
 * saved item is already the default selection.
 *
 * ## What Breaks If These Fail
 * After registering at checkout with a required phone, a saved address or
 * company is never written to the basket, and checkout stalls until refresh.
 */
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, ref, Suspense, type Component } from "vue";
import { createI18n } from "vue-i18n";
import BillingForm from "../BillingForm.vue";
import TabBusiness from "../TabBusiness.vue";
import TabPersonal from "../TabPersonal.vue";
import type { BillingModel } from "@upmind-automation/headless";

vi.hoisted(() => {
  (
    HTMLCanvasElement.prototype as unknown as { getContext: () => unknown }
  ).getContext = () =>
    new Proxy({}, { get: () => () => ({}), set: () => true });
});

const headless = await vi.hoisted(async () => {
  const { computed, ref } = await import("vue");
  const { vi } = await import("vitest");

  type Item = { id: string; default: boolean; addressId?: string };

  // The scoped four-layer shape the tabs read. Addresses and companies hand
  // back the default's id from `default()`; phones hand back the row.
  const makeList = (defaultIsId: boolean) => {
    const items = ref<Item[]>([]);
    const defaultItem = () => items.value.find(item => item.default);
    const scoped = {
      useContext: () => ({
        data: computed(() => items.value),
        default: () => (defaultIsId ? defaultItem()?.id : defaultItem()),
        getOne: (id?: string) => items.value.find(item => item.id === id)
      }),
      useMeta: () => ({
        isEmpty: computed(() => items.value.length === 0),
        isLoading: computed(() => false)
      }),
      useActions: () => ({
        isReady: async () => true,
        remove: vi.fn(),
        setDefault: vi.fn()
      })
    };
    return { items, use: vi.fn(() => ({ as: () => scoped })) };
  };

  const addresses = makeList(true);
  const companies = makeList(true);
  const phones = makeList(false);

  const billingMeta = ref({
    isLoading: false,
    isAvailable: true,
    hasErrors: false,
    isProcessing: false,
    isValid: true,
    isComplete: false,
    isDirty: false,
    needsAddress: true,
    needsCompany: false,
    needsPhone: false
  });
  const billingModel = ref<Record<string, unknown> | undefined>(undefined);
  const update = vi.fn(async (_value: unknown) => undefined);
  const set = vi.fn();

  const billing = {
    state: computed(() => []),
    isReady: async () => true,
    meta: computed(() => billingMeta.value),
    context: computed(() => undefined),
    errors: computed(() => undefined),
    model: computed(() => billingModel.value),
    schema: computed(() => undefined),
    uischema: computed(() => undefined),
    config: computed(() => undefined),
    set,
    update,
    clear: vi.fn(),
    wait: vi.fn(async () => true),
    captureInitialBilling: () => billingModel.value,
    useUnifiedBillingDetail: vi.fn()
  };

  return {
    addresses,
    companies,
    phones,
    billingMeta,
    billingModel,
    update,
    set,
    useBasketBilling: vi.fn(() => billing)
  };
});

vi.mock("@upmind-automation/headless", async () => {
  const { computed } = await import("vue");
  const inert = (): unknown =>
    new Proxy(function () {}, {
      get: (_target, key) =>
        typeof key === "symbol" || key === "then" || key.startsWith("__v")
          ? undefined
          : inert(),
      apply: () => inert(),
      construct: () => inert()
    });
  const known: Record<string, unknown> = {
    DomainTypes: {
      skip: "skip",
      register: "register",
      existing: "existing",
      basket: "basket"
    },
    useBasketBilling: headless.useBasketBilling,
    useClientAddresses: headless.addresses.use,
    useClientAddressManager: vi.fn(),
    useClientCompanies: headless.companies.use,
    useClientCompanyManager: vi.fn(),
    useClientPhones: headless.phones.use,
    useClientPhoneManager: vi.fn(),
    UnifiedType: { PERSONAL: "personal", BUSINESS: "business" },
    ScopeActorTypes: {
      SELF: "self",
      GUEST: "guest",
      CLIENT: "client",
      STAFF: "staff"
    },
    Store: class<T> {
      constructor(public state: T) {}
      subscribe() {
        return () => undefined;
      }
    },
    useActiveSession: () => ({
      useContext: () => ({ activeUser: computed(() => ({ id: "client" })) })
    }),
    useRoutingEngine: () => ({ isNavigating: computed(() => false) })
  };
  return new Proxy(known, {
    has: () => true,
    get: (target, key) =>
      typeof key === "symbol" || key === "then" || key === "__esModule"
        ? undefined
        : key in target
          ? target[key]
          : inert()
  });
});

const ManageStub = defineComponent({
  name: "ManageStub",
  props: ["label", "modelValue", "as", "manage"],
  emits: ["resolve", "processing", "update:modelValue"],
  template: `<div data-stub="manage"><slot name="additional" /></div>`
});

const ADDRESS = { id: "address-default", default: true };
const PHONE = { id: "phone-default", default: true };
const COMPANY = {
  id: "company-default",
  default: true,
  addressId: "company-address"
};

const mounted: VueWrapper[] = [];

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.unmount());
  headless.addresses.items.value = [];
  headless.companies.items.value = [];
  headless.phones.items.value = [];
  headless.billingMeta.value = {
    ...headless.billingMeta.value,
    needsPhone: false
  };
  headless.billingModel.value = undefined;
  vi.clearAllMocks();
});

function i18n() {
  return createI18n({
    legacy: false,
    locale: "en",
    missingWarn: false,
    fallbackWarn: false
  });
}

async function mountInSuspense(render: () => ReturnType<typeof h>) {
  const wrapper = mount(
    defineComponent({
      render: () => h(Suspense, null, { default: render })
    }),
    {
      global: {
        plugins: [i18n()],
        stubs: { Manage: ManageStub, teleport: true }
      }
    }
  );
  mounted.push(wrapper);
  await flushPromises();
  return wrapper;
}

async function mountTab(tab: Component) {
  const model = ref<BillingModel>({});
  const models: BillingModel[] = [];
  let formResolves = 0;

  const wrapper = await mountInSuspense(() =>
    h(tab, {
      modelValue: model.value,
      "onUpdate:modelValue": (value: BillingModel) => {
        model.value = value;
        models.push(value);
      },
      onFormResolve: () => {
        formResolves += 1;
      }
    })
  );

  return { wrapper, models, formResolves: () => formResolves };
}

async function mountBillingForm() {
  const model = ref<BillingModel | undefined>(undefined);
  return mountInSuspense(() =>
    h(BillingForm, {
      autoUpdate: true,
      modelValue: model.value,
      "onUpdate:modelValue": (value: BillingModel | undefined) => {
        model.value = value;
      }
    })
  );
}

// The tabs hand Manage local list adapters, so each Manage is found by its
// adapter's name.
const LIST = {
  addresses: "useAddressListForManage",
  companies: "useCompanyList",
  phones: "usePhoneListForManage"
};

function manageFor(wrapper: VueWrapper, useList: string) {
  const matches = wrapper
    .findAllComponents(ManageStub)
    .filter(stub => stub.props("manage")?.useList?.name === useList);
  expect(matches).toHaveLength(1);
  return matches[0];
}

describe("TabPersonal", () => {
  it("writes a saved default address to the billing model and resolves the form once", async () => {
    headless.addresses.items.value = [ADDRESS];
    headless.phones.items.value = [PHONE];
    const { wrapper, models, formResolves } = await mountTab(TabPersonal);
    const modelsBefore = models.length;
    const resolvesBefore = formResolves();

    manageFor(wrapper, LIST.addresses).vm.$emit("resolve", true, ADDRESS.id);
    await flushPromises();

    const added = models.slice(modelsBefore);
    expect(added).toHaveLength(1);
    expect(added[0].addressId).toBe(ADDRESS.id);
    expect(formResolves() - resolvesBefore).toBe(1);
  });

  it("writes a saved default phone to the billing model and resolves the form once", async () => {
    headless.billingMeta.value = {
      ...headless.billingMeta.value,
      needsPhone: true
    };
    headless.addresses.items.value = [ADDRESS];
    headless.phones.items.value = [PHONE];
    const { wrapper, models, formResolves } = await mountTab(TabPersonal);
    const modelsBefore = models.length;
    const resolvesBefore = formResolves();

    manageFor(wrapper, LIST.phones).vm.$emit("resolve", true, PHONE.id);
    await flushPromises();

    const added = models.slice(modelsBefore);
    expect(added).toHaveLength(1);
    expect(added[0].phoneId).toBe(PHONE.id);
    expect(formResolves() - resolvesBefore).toBe(1);
  });
});

describe("TabBusiness", () => {
  it("writes a saved default company and its address to the billing model and resolves the form once", async () => {
    headless.companies.items.value = [COMPANY];
    headless.phones.items.value = [PHONE];
    const { wrapper, models, formResolves } = await mountTab(TabBusiness);
    const modelsBefore = models.length;
    const resolvesBefore = formResolves();

    manageFor(wrapper, LIST.companies).vm.$emit("resolve", true, COMPANY.id);
    await flushPromises();

    const added = models.slice(modelsBefore);
    expect(added).toHaveLength(1);
    expect(added[0].companyId).toBe(COMPANY.id);
    expect(added[0].addressId).toBe(COMPANY.addressId);
    expect(formResolves() - resolvesBefore).toBe(1);
  });

  it("writes a saved default phone from inside the company selection and resolves the form once", async () => {
    headless.billingMeta.value = {
      ...headless.billingMeta.value,
      needsPhone: true
    };
    headless.companies.items.value = [COMPANY];
    headless.phones.items.value = [PHONE];
    const { wrapper, models, formResolves } = await mountTab(TabBusiness);
    const company = manageFor(wrapper, LIST.companies);
    const phone = manageFor(wrapper, LIST.phones);
    expect(
      company.findAllComponents(ManageStub).map(stub => stub.vm)
    ).toContain(phone.vm);
    const modelsBefore = models.length;
    const resolvesBefore = formResolves();

    phone.vm.$emit("resolve", true, PHONE.id);
    await flushPromises();

    const added = models.slice(modelsBefore);
    expect(added).toHaveLength(1);
    expect(added[0].phoneId).toBe(PHONE.id);
    expect(formResolves() - resolvesBefore).toBe(1);
  });
});

describe("BillingForm on the checkout page", () => {
  it("sends one basket update carrying a saved default address", async () => {
    headless.addresses.items.value = [ADDRESS];
    headless.phones.items.value = [PHONE];
    const wrapper = await mountBillingForm();
    const updatesBefore = headless.update.mock.calls.length;

    manageFor(wrapper, LIST.addresses).vm.$emit("resolve", true, ADDRESS.id);
    await flushPromises();

    const added = headless.update.mock.calls.slice(updatesBefore);
    expect(added).toHaveLength(1);
    expect(added[0][0]).toMatchObject({ addressId: ADDRESS.id });
  });
});
