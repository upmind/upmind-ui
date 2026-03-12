<template>
  <Loading :active="meta.isProcessing" class-active="w-full rounded">
    <Sections
      id="basket-billing"
      class="min-h-32"
      v-model="activeTab"
      :sections="tabs"
      data-testid="billing"
    >
      <template v-slot:[`section-personal`]>
        <TabPersonal
          v-model="modelValue"
          v-model:touched="touched"
          :expand="expand"
        />

        <Transition
          appear
          enter-active-class="transition-opacity duration-250 delay-500 ease-in"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
        >
          <Button
            v-if="!autoUpdate && formMeta.allowContinue"
            :label="t('action.continue_label')"
            icon-append="arrow-right"
            color="primary"
            size="lg"
            block
            :disabled="meta.isProcessing"
            @click="doContinue"
          />
        </Transition>
      </template>

      <template v-slot:[`section-business`]>
        <TabBusiness
          v-model="modelValue"
          v-model:touched="touched"
          :expand="expand"
        />

        <Transition
          appear
          enter-active-class="transition-opacity duration-250 delay-500 ease-in"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
        >
          <Button
            v-if="!autoUpdate && formMeta.allowContinue"
            :label="t('action.continue_label')"
            icon-append="arrow-right"
            color="primary"
            size="lg"
            block
            :disabled="meta.isProcessing"
            @click="doContinue"
          />
        </Transition>
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
  useClientPhones,
  useRoutingEngine
} from "@upmind-automation/headless";

// --- components
import { Loading, Button } from "@upmind-automation/upmind-ui";
import Sections from "../../../components/section/Sections.vue";
import TabBusiness from "./TabBusiness.vue";
import TabPersonal from "./TabPersonal.vue";

// --- types
import type { TabItem } from "@upmind-automation/upmind-ui";
import type { BillingModel } from "@upmind-automation/headless";
import type { BillingFormProps } from "../types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<BillingFormProps>(), {
  autoUpdate: true
});

const modelValue = defineModel<BillingFormProps["modelValue"]>("modelValue");
const touched = defineModel<BillingFormProps["touched"]>("touched");
// -----------------------------------------------------------------------------

const { t } = useI18n();

const { client } = useSession();
const { isReady, meta, config, set, update, model } = useBasketBilling();
const { navigateNext } = useRoutingEngine();

// ensure we preload our data for speed between the tab

const activeTab = ref<UnifiedType>();

const formMeta = computed(() => {
  const phoneReady = !meta.value.needsPhone || !phoneMeta.value.isEmpty;

  return {
    allowContinue:
      activeTab.value === UnifiedType.PERSONAL
        ? !addressMeta.value.isEmpty && phoneReady
        : !companyMeta.value.isEmpty && phoneReady
  };
});

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

const {
  getOne: getAddress,
  meta: addressMeta,
  default: defaultAddress
} = useClientAddresses();
const {
  getOne: getCompany,
  meta: companyMeta,
  default: defaultCompany
} = useClientCompanies();
const {
  getOne: getPhone,
  meta: phoneMeta,
  default: defaultPhone
} = useClientPhones();

const selectedAddress = computed(() =>
  getAddress(model.value?.addressId ?? undefined)
);
const selectedCompany = computed(() =>
  getCompany(model.value?.companyId ?? undefined)
);
const selectedPhone = computed(() =>
  getPhone(model.value?.phoneId ?? undefined)
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

// --- methods

function buildModel(): BillingModel | undefined {
  const phoneId = meta.value.needsPhone
    ? (modelValue.value?.phoneId ?? defaultPhone()?.id)
    : undefined;

  if (activeTab.value === UnifiedType.PERSONAL) {
    return { ...modelValue.value, companyId: undefined, phoneId };
  }

  if (
    activeTab.value === UnifiedType.BUSINESS &&
    !modelValue.value?.companyId
  ) {
    const company = defaultCompany();
    return {
      ...modelValue.value,
      companyId: company?.id,
      addressId: company?.addressId,
      phoneId
    };
  }

  return { ...modelValue.value, phoneId };
}

async function doContinue() {
  const value = buildModel();
  await update(value!);
  modelValue.value = value;
  navigateNext();
}

// --- side effects

watch(
  modelValue,
  value => {
    if (value && !meta.value.isProcessing) {
      props.autoUpdate ? update(value) : set(value);
    }
  },
  {
    immediate: true,
    deep: true
  }
);
</script>
