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
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, ref, Suspense, type Component } from "vue";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createI18n } from "vue-i18n";
import type { BillingModel } from "@upmind-automation/headless";
import TabPersonal from "../TabPersonal.vue";
import TabBusiness from "../TabBusiness.vue";
import BillingForm from "../BillingForm.vue";

vi.hoisted(() => {
  (HTMLCanvasElement.prototype as any).getContext = () =>
    new Proxy({}, { get: () => () => ({}), set: () => true });
});

const headless = await vi.hoisted(async () => {
  const { computed, ref } = await import("vue");
  const { vi } = await import("vitest");

  type Item = { id: string; default: boolean; addressId?: string };

  const makeList = () => {
    const items = ref<Item[]>([]);
    const api = {
      data: computed(() => items.value),
      meta: computed(() => ({
        isEmpty: items.value.length === 0,
        isLoading: false,
        isAvailable: true,
        hasError: false,
        hasNextPage: false,
        hasPrevPage: false,
        hasPages: false
      })),
      error: ref(null),
      default: () => items.value.find(item => item.default),
      getOne: (id?: string) => items.value.find(item => item.id === id),
      findOne: () => undefined,
      isReady: async () => true,
      remove: vi.fn(),
      setDefault: vi.fn(),
      refresh: vi.fn(async () => undefined),
      invalidate: vi.fn(async () => undefined),
      nextPage: vi.fn(),
      prevPage: vi.fn(),
      filters: { query: vi.fn() }
    };
    return { items, use: vi.fn(() => api) };
  };

  const addresses = makeList();
  const companies = makeList();
  const phones = makeList();

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
  const inert = (): any =>
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
    Store: class<T> {
      constructor(public state: T) {}
      subscribe() {
        return () => undefined;
      }
    },
    useSession: () => ({ client: computed(() => ({ id: "client" })) }),
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
  name: "Manage",
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

function manageFor(wrapper: VueWrapper, useList: unknown) {
  const matches = wrapper
    .findAllComponents(ManageStub)
    .filter(stub => stub.props("manage")?.useList === useList);
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

    manageFor(wrapper, headless.addresses.use).vm.$emit(
      "resolve",
      true,
      ADDRESS.id
    );
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

    manageFor(wrapper, headless.phones.use).vm.$emit("resolve", true, PHONE.id);
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

    manageFor(wrapper, headless.companies.use).vm.$emit(
      "resolve",
      true,
      COMPANY.id
    );
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
    const company = manageFor(wrapper, headless.companies.use);
    const phone = manageFor(wrapper, headless.phones.use);
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

    manageFor(wrapper, headless.addresses.use).vm.$emit(
      "resolve",
      true,
      ADDRESS.id
    );
    await flushPromises();

    const added = headless.update.mock.calls.slice(updatesBefore);
    expect(added).toHaveLength(1);
    expect(added[0][0]).toMatchObject({ addressId: ADDRESS.id });
  });
});
