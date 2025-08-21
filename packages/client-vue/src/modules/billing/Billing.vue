<template>
  <Loading :active="meta.isProcessing" class-active="w-full rounded">
    <Tabs
      :as="props.as"
      class="min-h-56"
      v-model="activeTab"
      :tabs="tabs"
      data-testid="billing"
    >
      <template v-slot:[`content.personal`]>
        <TabPersonal v-model="modelValue" />
      </template>

      <template v-slot:[`content.business`]>
        <TabBusiness v-model="modelValue" />
      </template>
    </Tabs>
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
  useClientCompanies
} from "@upmind-automation/headless";

// --- components
import { Tabs, Loading } from "@upmind-automation/upmind-ui";
import TabBusiness from "./components/TabBusiness.vue";
import TabPersonal from "./components/TabPersonal.vue";

// --- utils

// --- types
import type { TabItem } from "@upmind-automation/upmind-ui";
import type { BillingProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<Omit<BillingProps, "modelValue">>(), {
  as: "div",
  forceMount: false
});

const modelValue = defineModel<BillingProps["modelValue"]>("modelValue");
// -----------------------------------------------------------------------------

const { t } = useI18n();

const { user } = useSession();
const { isReady, meta, config, update, model } = useBasketBilling();

// ensure we preload our data for speed between the tab

const activeTab = ref<UnifiedType>();

await Promise.allSettled([
  isReady(),
  useClientAddresses(),
  useClientCompanies()
]).then(() => {
  // set initial value from the basket billing model
  modelValue.value ??= model.value;
  if (config.value?.requiresCompany || model.value?.companyId) {
    activeTab.value = UnifiedType.BUSINESS;
  } else {
    activeTab.value = UnifiedType.PERSONAL;
  }
});

const tabs = computed((): TabItem[] => {
  const tabItems: TabItem[] = [];

  if (!user.value?.id) return tabItems;

  if (!config.value?.requiresCompany) {
    tabItems.push({
      label: t("billing.personal"),
      value: UnifiedType.PERSONAL,
      eager: false
    });
  }
  tabItems.push({
    label: t("billing.business"),
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
