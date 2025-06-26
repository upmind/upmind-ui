<template>
  <pre>{{ { modelValue, meta, activeTab } }}</pre>
  <Loading :active="!meta.isAvailable" class="w-full">
    <Tabs v-model="activeTab" :tabs="tabs">
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
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  UnifiedAddressType,
  useSession,
  useBasketBilling,
} from "@upmind-automation/headless";

// --- components
import { Tabs, Loading } from "@upmind-automation/upmind-ui";
import TabBusiness from "./TabBusiness.vue";
import TabPersonal from "./TabPersonal.vue";

// --- utils

// --- types
import type { TabItem } from "@upmind-automation/upmind-ui";
import type { BillingModel } from "@upmind-automation/headless";
import { useVModel } from "@vueuse/core";

// -----------------------------------------------------------------------------

const props = defineProps<{
  modelValue?: BillingModel;
}>();

const emits = defineEmits<{
  (e: "update:modelValue", value: BillingModel): void;
}>();

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  deep: true,
});
// -----------------------------------------------------------------------------

const { t } = useI18n();

const { user } = useSession();
const { isReady, meta, config } = useBasketBilling();

const activeTab = ref<UnifiedAddressType>();

await isReady().then(() => {
  if (config.value?.requiresCompany)
    activeTab.value = UnifiedAddressType.BUSINESS;
  else activeTab.value = UnifiedAddressType.PERSONAL;
});

const tabs = computed((): TabItem[] => {
  const tabItems: TabItem[] = [];

  if (!user.value?.id) return tabItems;

  if (!config.value?.requiresCompany) {
    tabItems.push({
      label: t("billing.address"),
      value: UnifiedAddressType.PERSONAL,
      eager: false,
    });
  }
  tabItems.push({
    label: t("billing.company"),
    value: UnifiedAddressType.BUSINESS,
    eager: !!config.value?.requiresCompany,
  });

  return tabItems;
});

const defaultTab = computed((): UnifiedAddressType => {
  if (config.value?.requiresCompany) return UnifiedAddressType.BUSINESS;
  return UnifiedAddressType.PERSONAL;
});
</script>
