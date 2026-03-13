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
          :href="toControlId(error)"
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
import { Alert, Link } from "@upmind-automation/upmind-ui";

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
 * Converts an AJV error's instancePath to a jsonforms control ID.
 * Jsonforms generates control IDs from the uischema scope, e.g.
 * `#/properties/term`, `#/properties/options/properties/{catId}`.
 *
 * AJV instancePath uses `/` delimiters: `/term`, `/options/{catId}`.
 * We convert by joining segments with `/properties/` and prefixing `#/properties/`.
 *
 * For deep paths (e.g. `/options/catId/productId/quantity`), we truncate
 * to the rendered control depth (2 segments for nested sections).
 */
function toControlId(error: ErrorObject): string {
  // For `required` errors, AJV sets instancePath to the parent object
  // and places the missing field name in params.missingProperty.
  // We must combine them to get the full path to the actual field.
  let path = trimStart(error.instancePath, "/");
  if (error.keyword === "required" && error.params?.missingProperty) {
    path = path
      ? `${path}/${error.params.missingProperty}`
      : error.params.missingProperty;
  }
  const segments = compact(split(path, "/"));

  // Rendered controls exist at max depth 2 (e.g. options/{catId}, provisionFields/{key})
  // Root-level controls (term, quantity) naturally have only 1 segment
  const truncated = take(segments, 2);

  return `##/properties/${join(truncated, "/properties/")}`;
}
</script>
