<template>
  <div class="flex w-full flex-col gap-1">
    <header
      class="pointer-events-none flex w-full cursor-pointer! items-start justify-between"
    >
      <h3 class="text-md m-0 flex items-center gap-x-2 font-medium">
        {{ title }}
        <Badge
          v-if="meta?.isDefault"
          variant="minimal"
          color="neutral"
          size="sm"
          :label="t('text.default_label')"
        />
      </h3>

      <Link
        v-if="!props.readonly"
        :label="t('action.edit')"
        size="sm"
        color="muted"
        tabindex="-1"
        @mousedown.stop.prevent
        class="pointer-events-auto h-4"
        @click.stop.prevent="doEdit"
      />
    </header>

    <p class="text-muted text-sm-tight m-0">
      {{ description }}
    </p>

    <p
      v-if="regNumber"
      class="text-muted text-sm-tight m-0 inline-flex flex-wrap gap-x-1"
    >
      {{ t("text.company_number", { title, regNumber }) }}
    </p>

    <p
      v-if="tax?.number"
      class="text-muted text-sm-tight m-0 inline-flex flex-wrap gap-x-1"
    >
      {{ t("text.tax_number", { title, taxNumber: tax.number }) }}

      <template v-if="meta.hasTaxValidation && meta.hasTax">
        <Tooltip :label="validationReason" color="neutral">
          <Icon v-if="meta.hasValidTax" icon="check-circle" size="2xs" />
          <Icon v-else icon="alert-triangle" size="2xs" />
        </Tooltip>
      </template>
    </p>
  </div>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";

// --- components
import {
  Badge,
  Button,
  Icon,
  Tooltip,
  Link
} from "@upmind-automation/upmind-ui";

// --- types
import type { Company } from "@upmind-automation/headless";
import { computed } from "vue";

// -----------------------------------------------------------------------------

const props = defineProps<
  Company & {
    readonly?: boolean;
  }
>();

const emits = defineEmits<{
  (e: "edit", id: string): void;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();

const doEdit = () => {
  if (!props?.id) return;
  emits("edit", props.id);
};

const validationReason = computed(() => {
  switch (props.tax?.valid) {
    case 1:
      return t("text.tax_valid", props.tax.checked);
    case 0:
      return t("text.tax_invalid", props.tax);
    case null:
    default:
      return t("text.tax_pending", props.tax);
  }
});
</script>
