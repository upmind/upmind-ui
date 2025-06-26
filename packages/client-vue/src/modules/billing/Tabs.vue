<template>
  <pre>{{ modelValue }}</pre>
  <Loading :active="meta.isLoading" class="w-full">
    <Tabs
      :defaultValue="UnifiedAddressType.PERSONAL"
      :value="UnifiedAddressType.PERSONAL"
      :tabs="tabs"
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
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { UnifiedAddressType, useSession } from "@upmind-automation/headless";

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

const { meta, user } = useSession();

const tabs = computed((): TabItem[] => {
  if (!user.value?.id) return [];

  return [
    {
      label: t("billing.address"),
      value: UnifiedAddressType.PERSONAL,
      eager: true,
    },
    {
      label: t("billing.company"),
      value: UnifiedAddressType.BUSINESS,
      eager: true,
    },
  ];
});
</script>
