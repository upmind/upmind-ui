<template>
  <Loading :active="meta.isLoading || meta.isProcessing" class="w-full">
    <Tabs
      v-if="meta.isAvailable"
      v-model="activeTab"
      :tabs="tabs"
      :default-tab="defaultTab"
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
  useBasketBilling
} from "@upmind-automation/headless";

// --- components
import { Tabs, Loading } from "@upmind-automation/upmind-ui";
import TabBusiness from "./components/TabBusiness.vue";
import TabPersonal from "./components/TabPersonal.vue";

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
  deep: true
});
// -----------------------------------------------------------------------------

const { t } = useI18n();

const { user } = useSession();
const { isReady, meta, config, update, model } = useBasketBilling();

const activeTab = ref<UnifiedType>();

await isReady().then(() => {
  // set initial value from the basket billing model
  modelValue.value ??= model.value;

  if (config.value?.requiresCompany || model.value?.companyId)
    activeTab.value = UnifiedType.BUSINESS;
  else activeTab.value = UnifiedType.PERSONAL;
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

const defaultTab = computed((): UnifiedType => {
  if (config.value?.requiresCompany) return UnifiedType.BUSINESS;
  return UnifiedType.PERSONAL;
});

// --- side effects

watch(
  modelValue,
  value => {
    if (value) {
      update(value).catch(error => {
        console.error("Error updating billing model:", error);
      });
    }
  },
  {
    immediate: true,
    deep: true
  }
);
</script>
