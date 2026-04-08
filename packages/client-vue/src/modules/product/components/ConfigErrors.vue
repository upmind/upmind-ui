<template>
  <Alert
    class="w-full"
    v-if="props.visible"
    color="danger"
    variant="minimal"
    icon="alert-triangle"
    :title="t('error.product_not_valid', { errorCount })"
    :description="t('text.check_required_fields_desc')"
  >
    <ol
      class="text-sm-tight w-full list-disc p-6 py-2 text-left"
      v-auto-animate
    >
      <li
        v-for="error in props.errors"
        :key="toControlId(error)"
        class="text-sm marker:text-inherit"
      >
        <Link
          size="inherit"
          :href="`#${toControlId(error)}`"
          :label="t('action.review')"
        >
          <span>{{ error?.message }}</span>
        </Link>
      </li>
    </ol>

    <input autofocus class="sr-only" id="prevent-autoscroll" />
  </Alert>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- components
import { Alert, Link, toSafeControlId } from "@upmind-automation/upmind-ui";

// --- utils
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
