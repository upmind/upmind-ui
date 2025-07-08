<template>
  <Loading :active="meta.isLoading || meta.isProcessing" class="w-full">
    <div
      ref="containerRef"
      class="overflow-hidden transition-[height] duration-300 ease-in-out"
    >
      <Tabs
        v-if="meta.isAvailable"
        v-model="activeTab"
        :tabs="tabs"
        :default-tab="defaultTab"
      >
        <template v-slot:[`content.personal`]>
          <div class="transition-opacity duration-200 ease-in-out">
            <TabPersonal v-model="modelValue" />
          </div>
        </template>

        <template v-slot:[`content.business`]>
          <div class="transition-opacity duration-200 ease-in-out">
            <TabBusiness v-model="modelValue" />
          </div>
        </template>
      </Tabs>
    </div>
  </Loading>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref, watch, nextTick } from "vue";
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
const containerRef = ref<HTMLElement>();
const previousHeight = ref<number>(0);

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

watch(activeTab, async () => {
  if (!containerRef.value) return;
  containerRef.value.style.height = `${containerRef.value.scrollHeight}px`;
});

watch(
  () => meta.value.isLoading,
  async isLoading => {
    if (!isLoading && containerRef.value) {
      containerRef.value.style.height = "";
    }
  }
);
</script>
