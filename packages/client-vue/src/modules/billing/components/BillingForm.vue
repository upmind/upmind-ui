<template>
  <Loading
    :active="meta.showOverlay"
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
      :card="card || undefined"
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
          v-if="(isMobile || inline) && meta.showContinue"
          :label="t('action.continue_label')"
          icon-append="arrow-right"
          color="primary"
          size="lg"
          block
          :loading="billingMeta.isProcessing || isNavigating"
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
          v-if="(isMobile || inline) && meta.showContinue"
          :label="t('action.continue_label')"
          icon-append="arrow-right"
          color="primary"
          size="lg"
          block
          :loading="billingMeta.isProcessing || isNavigating"
          @click="doContinue"
        />
      </template>
    </Sections>
  </Loading>

  <Teleport v-if="isMounted && !inline && !isMobile" to="#billing-actions">
    <Button
      v-if="meta.showContinue"
      :label="t('action.continue_label')"
      icon-append="arrow-right"
      color="primary"
      size="lg"
      block
      :loading="billingMeta.isProcessing || isNavigating"
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

const emit = defineEmits<{
  resolve: [];
}>();
// -----------------------------------------------------------------------------

const { t } = useI18n();

const stylesMeta = computed(() => ({ card: props.card }));
const styles = useStyles(
  ["billing.form", "billing.loading"],
  stylesMeta,
  billingConfig
);

// Teleport cannot use `defer` inside async setup (Suspense + KeepAlive conflict),
// so we gate it on isMounted to ensure the DOM target exists before teleporting.
const isMounted = useMounted();

const { client } = useSession();
const {
  isReady,
  meta: billingMeta,
  config,
  set,
  update,
  wait,
  model
} = useBasketBilling();
const { isNavigating } = useRoutingEngine();

// ensure we preload our data for speed between the tab

const activeTab = ref<UnifiedType>();

const meta = computed(() => {
  const phoneReady = !billingMeta.value.needsPhone || !phoneMeta.value.isEmpty;
  const addressReady =
    !billingMeta.value.needsAddress || !addressMeta.value.isEmpty;
  // Business billing needs a company to continue with, even when the brand
  // doesn't force one — otherwise Continue shows alongside the add-company form
  // and commits empty, wiping the address.
  const companyReady = !companyMeta.value.isEmpty;
  const allowContinue =
    activeTab.value === UnifiedType.PERSONAL
      ? addressReady && phoneReady
      : companyReady && phoneReady;
  // Without autosave, Continue is the commit path — so it must exist whenever the
  // model is committable. Nothing else may gate it: selecting a saved entry never
  // reaches onFormResolve (Manage wires that to the form only), so hiding Continue
  // would leave the shopper with no way to save at all.
  const showContinue = !props.autoUpdate && allowContinue;
  // The inline Continue already shows progress, so the full-form overlay would
  // double up; a full-page billing form is where the overlay leads.
  const showOverlay =
    billingMeta.value.isProcessing && !(props.inlineEditing && showContinue);
  return { showContinue, showOverlay };
});

// The client-data isReady()s resolve once the auth check settles (checkout
// only mounts this form for authenticated sessions, guest clients included),
// so a refresh mid-token-validation still loads saved billing.
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
  const phoneId = billingMeta.value.needsPhone
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
  emit("resolve");
}

async function onFormResolve() {
  if (props.autoUpdate) return;
  await wait(true);
  await update(buildModel()!);
  // Inline editing closes the editor only once billing is complete, so saving one
  // detail while another is still required keeps the shopper here rather than
  // dropping them onto an incomplete summary with nothing to action.
  if (props.inlineEditing && !billingMeta.value.isComplete) return;
  emit("resolve");
}

// --- side effects

watch(
  modelValue,
  value => {
    if (value && !billingMeta.value.isProcessing) {
      props.autoUpdate ? update(value) : set(value);
    }
  },
  {
    immediate: true,
    deep: true
  }
);
</script>
