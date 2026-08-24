<template>
  <div class="flex w-full flex-col gap-1">
    <header
      class="pointer-events-none flex w-full cursor-pointer! items-start justify-between"
    >
      <h3 class="text-md m-0 flex items-center gap-x-2 font-medium">
        {{ title }}
        <Badge
          v-if="meta?.isDefault"
          appearance="solid"
          variant="neutral"
          size="sm"
          :label="t('text.default_label')"
        />
      </h3>

      <div v-if="!props.readonly">
        <Link
          :label="t('action.edit')"
          size="sm"
          color="muted"
          tabindex="-1"
          @mousedown.stop.prevent
          class="pointer-events-auto h-4"
          @click.stop.prevent="doEdit"
        />

        <Link
          v-if="!props.readonly && !meta?.isDefault"
          :label="t('action.set_as_default')"
          size="sm"
          color="muted"
          tabindex="-1"
          @mousedown.stop.prevent
          class="pointer-events-auto ml-2 h-4"
          @click.stop.prevent="setDefault"
        />

        <Link
          v-if="!props.default"
          :label="t('action.remove')"
          size="sm"
          color="muted"
          tabindex="-1"
          @mousedown.stop.prevent
          class="pointer-events-auto ml-2 h-4"
          @click.stop.prevent="doDelete"
        />
      </div>
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
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Icon } from "@upmind-automation/client-vue";
import { Badge, Tooltip, Link } from "@upmind/ui";
import type { Company } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const props = defineProps<
  Company & {
    readonly?: boolean;
  }
>();

const emits = defineEmits<{
  (e: "edit", id: string): void;
  (e: "remove", id: string): void;
  (e: "setDefault", id: string): void;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();

const doEdit = () => {
  if (!props?.id) return;
  emits("edit", props.id);
};

const doDelete = () => {
  if (!props?.id) return;
  emits("remove", props.id);
};

const setDefault = () => {
  if (!props?.id) return;
  emits("setDefault", props.id);
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
