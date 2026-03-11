<template>
  <Loading
    :active="meta.isProcessing"
    class-active="w-full rounded"
    :class="meta.isProcessing ? 'overflow-hidden' : ''"
  >
    <Sections
      id="basket-billing"
      class="min-h-32"
      v-model="activeTab"
      :sections="tabs"
      data-testid="billing"
    >
      <template v-slot:[`section-personal`]>
        <TabPersonal v-model="modelValue" v-model:touched="touched" />
      </template>

      <template v-slot:[`section-business`]>
        <TabBusiness v-model="modelValue" v-model:touched="touched" />
      </template>
    </Sections>
  </Loading>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  UnifiedType,
  useSession,
  useBasketBilling,
  useClientAddresses,
  useClientCompanies,
  useClientPhones
} from "@upmind-automation/headless";

// --- components
import { Loading } from "@upmind-automation/upmind-ui";
import Sections from "../../../components/section/Sections.vue";
import TabBusiness from "./TabBusiness.vue";
import TabPersonal from "./TabPersonal.vue";

// --- types
import type { TabItem } from "@upmind-automation/upmind-ui";
import type { BillingFormProps } from "../types";

// -----------------------------------------------------------------------------

const props = defineProps<BillingFormProps>();

const modelValue = defineModel<BillingFormProps["modelValue"]>("modelValue");
const touched = defineModel<BillingFormProps["touched"]>("touched");
// -----------------------------------------------------------------------------

const { t } = useI18n();

const { client } = useSession();
const { isReady, meta, config, update, model } = useBasketBilling();

// ensure we preload our data for speed between the tab

const activeTab = ref<UnifiedType>();

await Promise.allSettled([
  isReady(),
  useClientAddresses().isReady(),
  useClientCompanies().isReady(),
  useClientPhones().isReady()
]).then(() => {
  const { default: defaultCompany } = useClientCompanies();
  // set initial value from the basket billing model
  modelValue.value ??= model.value;
  if (
    config.value?.requiresCompany ||
    model.value?.companyId ||
    (!model.value?.addressId && defaultCompany()?.id) // if we dont have an address but do have a default company, prefer business
  ) {
    activeTab.value = UnifiedType.BUSINESS;
  } else {
    activeTab.value = UnifiedType.PERSONAL;
  }
});

// --- summary

const { getOne: getAddress } = useClientAddresses();
const { getOne: getCompany } = useClientCompanies();
const { getOne: getPhone } = useClientPhones();

const selectedAddress = computed(() =>
  getAddress(model.value?.addressId ?? undefined)
);
const selectedCompany = computed(() =>
  getCompany(model.value?.companyId ?? undefined)
);
const selectedPhone = computed(() =>
  getPhone(model.value?.phoneId ?? undefined)
);

const hasBillingSelected = computed(
  () =>
    !!selectedAddress.value || !!selectedCompany.value || !!selectedPhone.value
);

// --- tabs

const tabs = computed((): TabItem[] => {
  const tabItems: TabItem[] = [];

  if (!client.value?.id) return tabItems;

  if (!config.value?.requiresCompany) {
    tabItems.push({
      icon: "user-01",
      label: t("text.personal_details"),
      value: UnifiedType.PERSONAL,
      eager: false
    });
  }
  tabItems.push({
    icon: "building-07",
    label: t("text.business_details"),
    value: UnifiedType.BUSINESS,
    eager: !!config.value?.requiresCompany
  });

  return tabItems;
});

// --- side effects

watch(
  modelValue,
  value => {
    if (value) update(value);
  },
  {
    immediate: true,
    deep: true
  }
);
</script>
