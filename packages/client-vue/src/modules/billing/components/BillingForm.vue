<template>
  <Loading
    :active="meta.isProcessing"
    :ui-config="{
      loading: {
        root: [styles.billing.loading.root],
        spinner: [styles.billing.loading.spinner]
      }
    }"
  >
    <Sections
      id="basket-billing"
      :class="styles.billing.form.sections"
      v-model="activeTab"
      :sections="tabs"
      data-testid="billing"
    >
      <template v-slot:[`section-personal`]>
        <TabPersonal
          v-model="modelValue"
          v-model:touched="touched"
          :expand="expand"
          @form-resolve="onFormResolve"
        />
        <Button
          v-if="
            (isMobile || inline) &&
            !autoUpdate &&
            formMeta.allowContinue &&
            !isInitialBilling
          "
          :label="t('action.continue_label')"
          icon-append="arrow-right"
          color="primary"
          size="lg"
          block
          :disabled="meta.isProcessing"
          @click="doContinue"
        />
      </template>

      <template v-slot:[`section-business`]>
        <TabBusiness
          v-model="modelValue"
          v-model:touched="touched"
          :expand="expand"
          @form-resolve="onFormResolve"
        />
        <Button
          v-if="
            (isMobile || inline) &&
            !autoUpdate &&
            formMeta.allowContinue &&
            !isInitialBilling
          "
          :label="t('action.continue_label')"
          icon-append="arrow-right"
          color="primary"
          size="lg"
          block
          :disabled="meta.isProcessing"
          @click="doContinue"
        />
      </template>
    </Sections>
  </Loading>

  <Teleport v-if="isMounted && !inline && !isMobile" to="#billing-actions">
    <Button
      v-if="!autoUpdate && formMeta.allowContinue && !isInitialBilling"
      :label="t('action.continue_label')"
      icon-append="arrow-right"
      color="primary"
      size="lg"
      block
      :disabled="meta.isProcessing"
      @click="doContinue"
    />
  </Teleport>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useMounted } from "@vueuse/core";

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
import billingConfig from "../billing.config";

// --- components
import {
  Loading,
  Button,
  isMobile,
  useStyles
} from "@upmind-automation/upmind-ui";
import Sections from "../../../components/section/Sections.vue";
import TabBusiness from "./TabBusiness.vue";
import TabPersonal from "./TabPersonal.vue";

// --- types
import type { TabItem } from "@upmind-automation/upmind-ui";
import type { BillingModel } from "@upmind-automation/headless";
import type { BillingFormProps } from "../types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<BillingFormProps>(), {
  autoUpdate: true,
  inline: false
});

const modelValue = defineModel<BillingFormProps["modelValue"]>("modelValue");
const touched = defineModel<BillingFormProps["touched"]>("touched");
// -----------------------------------------------------------------------------

const { t } = useI18n();
const styles = useStyles(
  ["billing.form", "billing.loading"],
  {},
  billingConfig
);

// Teleport cannot use `defer` inside async setup (Suspense + KeepAlive conflict),
// so we gate it on isMounted to ensure the DOM target exists before teleporting.
const isMounted = useMounted();

const { client } = useSession();
const {
  isReady,
  meta,
  config,
  set,
  update,
  wait,
  model,
  captureInitialBilling
} = useBasketBilling();
const { navigateNext } = useRoutingEngine();

// ensure we preload our data for speed between the tab

const activeTab = ref<UnifiedType>();

// Snapshot: did the user land without committed billing? Captured per-mount
// after the billing actor's data is ready and held for the form's lifetime,
// so the create-and-auto-navigate flow doesn't briefly reveal the Continue
// button when baseModel updates after persistModel runs. Mirrors the
// captureSchemas pattern in useProductSetup, scoped to the consumer's
// lifecycle (because the billing actor is global and persistent).
const isInitialBilling = ref(true);

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
  const { addressId, companyId } = captureInitialBilling() ?? {};
  isInitialBilling.value = !addressId && !companyId;
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

async function onFormResolve() {
  if (!props.autoUpdate) {
    await wait(true);
    await update(buildModel()!);
    navigateNext();
  }
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
