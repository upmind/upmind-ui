<template>
  <article
    class="border-border-secondary rounded-lg border p-4 transition-colors"
    :class="{
      'border-utility-error-200 bg-utility-error-25':
        !status.complete && !status.skipped,
      'border-border-brand bg-bg-brand-secondary': status.complete
    }"
    :data-testid="`registrant-card-${status.domain}`"
  >
    <header class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Icon icon="globe-02" size="md" class="text-fg-quaternary" />
        <h4 class="text-fg-primary text-sm font-semibold">
          {{ status.domain }}
        </h4>
      </div>

      <div class="flex items-center gap-2">
        <Badge
          v-if="status.complete"
          variant="muted"
          color="success"
          size="sm"
          :label="t('text.complete')"
        />
        <Badge
          v-else-if="status.skipped"
          variant="muted"
          color="neutral"
          size="sm"
          :label="t('text.skipped')"
        />
        <Badge
          v-else
          variant="muted"
          color="danger"
          size="sm"
          icon="alert-triangle"
          :label="t('domain.missing_data')"
        />

        <Button
          variant="link"
          color="primary"
          size="sm"
          :label="t('action.change')"
          @click="emit('edit', status.productId)"
        />
      </div>
    </header>

    <div class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      <RegistrantField
        :label="t('form.registrant_name')"
        :value="status.registrant.name"
        required
      />
      <RegistrantField
        :label="t('form.registrant_organisation')"
        :value="status.registrant.organisation"
      />
      <RegistrantField
        :label="t('form.registrant_email')"
        :value="status.registrant.email"
        required
      />
      <RegistrantField
        :label="t('form.registrant_phone')"
        :value="status.registrant.phone"
        required
      />
      <RegistrantField
        :label="t('form.registrant_address')"
        :value="status.registrant.address1"
        required
      />
      <RegistrantField
        :label="t('form.registrant_city')"
        :value="status.registrant.city"
        required
      />
      <RegistrantField
        :label="t('form.registrant_state')"
        :value="status.registrant.state"
      />
      <RegistrantField
        :label="t('form.registrant_postcode')"
        :value="status.registrant.postcode"
        required
      />
      <RegistrantField
        :label="t('form.registrant_country')"
        :value="status.registrant.country"
        required
      />
    </div>
  </article>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";

// --- components
import { Badge, Button, Icon } from "@upmind-automation/upmind-ui";
import RegistrantField from "./RegistrantField.vue";

// --- types
import type { DomainRegistrantStatus } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

defineProps<{
  status: DomainRegistrantStatus;
}>();

const emit = defineEmits<{
  (e: "edit", productId: string): void;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();
</script>
