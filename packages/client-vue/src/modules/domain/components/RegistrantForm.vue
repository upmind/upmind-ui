<template>
  <section class="flex w-full flex-col gap-6" data-testid="registrant-form">
    <header class="flex flex-col gap-1">
      <h3 class="text-fg-primary text-lg font-semibold">
        {{ t("domain.registrant_details_title") }}
      </h3>
      <p class="text-fg-tertiary text-sm">
        {{ t("domain.registrant_details_msg") }}
      </p>
    </header>

    <form @submit.prevent="onSave" class="flex flex-col gap-4">
      <!-- Name -->
      <div class="flex flex-col gap-1.5">
        <label
          class="text-fg-secondary text-sm font-medium"
          for="registrant-name"
        >
          {{ t("form.registrant_name") }} *
        </label>
        <Input
          id="registrant-name"
          v-model="formData.name"
          :placeholder="t('form.registrant_name_placeholder')"
          required
        />
      </div>

      <!-- Organisation (optional) -->
      <div class="flex flex-col gap-1.5">
        <label
          class="text-fg-secondary text-sm font-medium"
          for="registrant-org"
        >
          {{ t("form.registrant_organisation") }}
        </label>
        <Input
          id="registrant-org"
          v-model="formData.organisation"
          :placeholder="t('form.registrant_organisation_placeholder')"
        />
      </div>

      <!-- Email -->
      <div class="flex flex-col gap-1.5">
        <label
          class="text-fg-secondary text-sm font-medium"
          for="registrant-email"
        >
          {{ t("form.registrant_email") }} *
        </label>
        <Input
          id="registrant-email"
          v-model="formData.email"
          type="email"
          :placeholder="t('form.registrant_email_placeholder')"
          required
        />
      </div>

      <!-- Phone -->
      <div class="flex flex-col gap-1.5">
        <label
          class="text-fg-secondary text-sm font-medium"
          for="registrant-phone"
        >
          {{ t("form.registrant_phone") }} *
        </label>
        <Input
          id="registrant-phone"
          v-model="formData.phone"
          type="tel"
          :placeholder="t('form.registrant_phone_placeholder')"
          required
        />
      </div>

      <!-- Address -->
      <div class="flex flex-col gap-1.5">
        <label
          class="text-fg-secondary text-sm font-medium"
          for="registrant-address1"
        >
          {{ t("form.registrant_address") }} *
        </label>
        <Input
          id="registrant-address1"
          v-model="formData.address1"
          :placeholder="t('form.registrant_address_placeholder')"
          required
        />
      </div>

      <!-- City + State row -->
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label
            class="text-fg-secondary text-sm font-medium"
            for="registrant-city"
          >
            {{ t("form.registrant_city") }} *
          </label>
          <Input
            id="registrant-city"
            v-model="formData.city"
            :placeholder="t('form.registrant_city_placeholder')"
            required
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label
            class="text-fg-secondary text-sm font-medium"
            for="registrant-state"
          >
            {{ t("form.registrant_state") }}
          </label>
          <Input
            id="registrant-state"
            v-model="formData.state"
            :placeholder="t('form.registrant_state_placeholder')"
          />
        </div>
      </div>

      <!-- Postcode + Country row -->
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label
            class="text-fg-secondary text-sm font-medium"
            for="registrant-postcode"
          >
            {{ t("form.registrant_postcode") }} *
          </label>
          <Input
            id="registrant-postcode"
            v-model="formData.postcode"
            :placeholder="t('form.registrant_postcode_placeholder')"
            required
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label
            class="text-fg-secondary text-sm font-medium"
            for="registrant-country"
          >
            {{ t("form.registrant_country") }} *
          </label>
          <Input
            id="registrant-country"
            v-model="formData.country"
            :placeholder="t('form.registrant_country_placeholder')"
            required
          />
        </div>
      </div>

      <!-- Domain checkboxes -->
      <DomainCheckboxes ref="domainCheckboxesRef" />

      <!-- Actions -->
      <Transition
        appear
        enter-active-class="transition-opacity duration-250 delay-500 ease-in"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
      >
        <Button
          type="submit"
          :label="t('action.save_registrant_details')"
          icon-append="arrow-right"
          color="primary"
          size="lg"
          block
          :loading="isSaving"
          :disabled="!isFormValid || isSaving"
        />
      </Transition>
    </form>
  </section>
</template>

<script setup lang="ts">
// --- external
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useDomainRegistrant } from "@upmind-automation/headless";
import { useRoutingEngine } from "@upmind-automation/headless";

// --- components
import { Button, Input } from "@upmind-automation/upmind-ui";
import DomainCheckboxes from "./DomainCheckboxes.vue";

// --- utils
import { forEach, isEmpty } from "lodash-es";
import {
  hasAllRequiredRegistrantFields,
  emptyRegistrant
} from "@upmind-automation/headless";

// --- types
import type { RegistrantDetails } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const props = defineProps<{
  /** Basket product ID to pre-fill registrant for (editing mode) */
  productId?: string;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();
const { navigateNext } = useRoutingEngine();
const {
  getRegistrant,
  updateRegistrant,
  saveRegistrant,
  applyBillingToProducts
} = useDomainRegistrant();

const domainCheckboxesRef = ref<InstanceType<typeof DomainCheckboxes>>();
const isSaving = ref(false);

// --- form data

const formData = reactive<RegistrantDetails>(
  props.productId
    ? { ...getRegistrant(props.productId) }
    : { ...emptyRegistrant() }
);

const isFormValid = computed(() => hasAllRequiredRegistrantFields(formData));

// --- methods

async function onSave(): Promise<void> {
  if (!isFormValid.value) return;

  isSaving.value = true;

  try {
    // Get checked domain IDs from checkboxes
    const checkedIds = domainCheckboxesRef.value?.getCheckedIds() ?? [];

    // Apply registrant details to every checked domain
    forEach(checkedIds, (id: string) => {
      updateRegistrant(id, { ...formData });
    });

    // Save provision fields for each checked domain
    await Promise.all(checkedIds.map((id: string) => saveRegistrant(id)));

    navigateNext();
  } finally {
    isSaving.value = false;
  }
}

// --- watchers

// Sync form data to composable when editing a single product
watch(
  formData,
  (value: RegistrantDetails) => {
    if (props.productId) {
      updateRegistrant(props.productId, { ...value });
    }
  },
  { deep: true }
);
</script>
