<template>
  <Tabs
    :defaultValue="BillingType.PERSONAL"
    :value="BillingType.PERSONAL"
    :tabs="tabs"
  >
    <template v-for="tab in tabs" v-slot:[`content.${tab.value}`]>
      <Tab :key="tab.value" :type="castType(tab)" v-model="modelValue" />
    </template>
  </Tabs>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

// --- components
import { Tabs } from "@upmind-automation/upmind-ui";
import Tab from "./components/Tab.vue";

// --- utils

// --- types
import type { TabItem } from "@upmind-automation/upmind-ui";
import type { BillingModel } from "@upmind-automation/headless";
import { BillingType } from "./types";
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

const tabs = computed((): TabItem[] => {
  return [
    {
      label: t("billing.address"),
      value: BillingType.PERSONAL,
    },
    {
      label: t("billing.company"),
      value: BillingType.BUSINESS,
    },
  ];
});

function castType(tab: TabItem): BillingType {
  return tab.value as BillingType;
}
</script>
