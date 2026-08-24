<template>
  <Button
    v-bind="buttonProps"
    :aria-label="label"
    :data-attrs="mergedDataAttrs"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" role="status" class="sr-only">{{
      t("text.loading")
    }}</span>
    <Icon v-if="icon" :icon="icon" size="nano" aria-hidden="true" />
    <span v-if="iconOnly" class="sr-only">{{ label }}</span>
    <template v-else>{{ label }}</template>
    <Icon
      v-if="iconAppend && !iconOnly"
      :icon="iconAppend"
      size="nano"
      aria-hidden="true"
    />
  </Button>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/components/ButtonItems
 * @description Wrapper that bridges the old prop-based Button API (`:icon`,
 * `:label`) to the new slot-based @upmind/ui Button. Renders Icon + label as
 * slotted content, with sr-only treatment for iconOnly buttons.
 *
 * Exposes `icon` prop so specs can read it via `findComponent({ name: "ButtonItems" }).props("icon")`.
 */

import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Button } from "@upmind/ui";
import { Icon } from "@upmind-automation/client-vue";
import { kebabCase, omit } from "lodash-es";
import type { ButtonVariants, DataAttrs } from "@upmind/ui";
// -----------------------------------------------------------------------------

defineOptions({ name: "ButtonItems" });

const { t } = useI18n();

const props = defineProps<{
  icon?: string;
  iconAppend?: string;
  label: string;
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
  iconOnly?: boolean;
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
  class?: string;
  dataAttrs?: DataAttrs;
}>();

defineEmits<{
  click: [event: MouseEvent];
}>();

const buttonProps = computed(() =>
  omit(props, ["icon", "iconAppend", "label", "dataAttrs"])
);

const mergedDataAttrs = computed<DataAttrs>(() => ({
  "data-test-value": kebabCase(props.label),
  ...props.dataAttrs
}));
</script>
