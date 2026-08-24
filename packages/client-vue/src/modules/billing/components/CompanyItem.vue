<template>
  <div class="flex w-full flex-col gap-1">
    <header
      class="pointer-events-none flex w-full cursor-pointer! items-start justify-between"
    >
      <h3 class="m-0 flex items-center gap-x-2 text-base font-medium">
        {{ title }}
        <Badge
          v-if="meta?.isDefault"
          appearance="outline"
          variant="neutral"
          size="sm"
        >
          {{ t("text.default_label") }}
        </Badge>
      </h3>

      <Link
        v-if="!props.readonly"
        size="sm"
        color="muted"
        tabindex="-1"
        :data-attrs="{ 'data-test-key': 'link-edit' }"
        @mousedown.stop.prevent
        class="pointer-events-auto h-4"
        @click.stop.prevent="doEdit"
        >{{ t("action.edit") }}</Link
      >
    </header>

    <p class="text-muted m-0 text-sm">
      {{ description }}
    </p>

    <p
      v-if="regNumber"
      class="text-muted m-0 inline-flex flex-wrap gap-x-1 text-sm"
    >
      {{ t("text.company_number", { title, regNumber }) }}
    </p>

    <p
      v-if="tax?.number"
      class="text-muted m-0 inline-flex flex-wrap gap-x-1 text-sm"
    >
      {{ t("text.tax_number", { title, taxNumber: tax.number }) }}

      <template v-if="meta.hasTaxValidation && meta.hasTax">
        <Tooltip>
          <Icon v-if="meta.hasValidTax" icon="check-circle" size="sm" />
          <Icon v-else icon="alert-triangle" size="sm" />
          <template #content>{{ validationReason }}</template>
        </Tooltip>
      </template>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Badge } from "@upmind/ui";
import { Link } from "@upmind/ui";
import { Tooltip } from "@upmind/ui";
import { Icon } from "../../../components/icon";
import type { Company } from "@upmind-automation/headless";

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
