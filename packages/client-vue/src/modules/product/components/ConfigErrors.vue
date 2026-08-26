<template>
  <Alert
    class="w-full"
    v-if="props.visible"
    variant="danger"
    appearance="outline"
    :title="t('error.product_not_valid', { errorCount })"
    :description="t('text.check_required_fields_desc')"
    :data-attrs="{ 'data-test-key': 'product-incomplete-alert' }"
  >
    <template #icon><Icon icon="alert-triangle" /></template>
    <ol v-if="errorCount" class="w-full list-disc p-6 py-2 text-left text-sm">
      <li
        v-for="error in props.errors"
        :key="toControlId(error)"
        class="text-sm marker:text-inherit"
      >
        <Link size="inherit" :href="`#${toControlId(error)}`">
          <span>{{ error?.message }}</span>
        </Link>
      </li>
    </ol>

    <input autofocus class="sr-only" id="prevent-autoscroll" />
  </Alert>
</template>

<script setup lang="ts">
import { Link } from "@upmind/ui";
import { Alert } from "@upmind/ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { toSafeControlId } from "../../../components/form";
import { Icon } from "../../../components/icon";
import { compact, join, size, split, take, trimStart } from "lodash-es";
import type { ErrorObject } from "@upmind-automation/headless";

// --- types

// -----------------------------------------------------------------------------

const props = defineProps<{
  errors?: ErrorObject[];
  visible?: boolean;
}>();

const { t } = useI18n();

const errorCount = computed(() => size(props.errors));

/**
 * Converts an AJV error's instancePath to a safe control ID matching
 * the sanitized element ID rendered by JSON Forms via toSafeControlId.
 */
function toControlId(error: ErrorObject): string {
  let path = trimStart(error.instancePath, "/");
  if (error.keyword === "required" && error.params?.missingProperty) {
    path = path
      ? `${path}/${error.params.missingProperty}`
      : error.params.missingProperty;
  }
  const segments = compact(split(path, "/"));
  const truncated = take(segments, 2);

  return toSafeControlId(`#/properties/${join(truncated, "/properties/")}`);
}
</script>
