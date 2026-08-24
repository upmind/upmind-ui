<template>
  <Alert
    v-if="meta.isActive || (scheduled && meta.isScheduled)"
    :title="message.value.title"
    :description="message.value.copy"
    :variant="message.value.type"
    :data-attrs="{ 'data-test-key': 'message', ...props.dataAttrs }"
  >
    <template #icon><Icon :icon="message.value.icon" /></template>
  </Alert>
</template>

<script lang="ts" setup>
import { useMessage } from "@upmind-automation/headless";
import { Alert } from "@upmind/ui";
import { Icon } from "../../../components/icon";

// -----------------------------------------------------------------------------
const props = withDefaults(
  defineProps<{
    item: object; // xstate actor
    scheduled?: boolean;
    anchor?: string;
    /** Message layout, not the Alert visual variant. */
    variant?: "inline" | "stacked";
    block?: boolean;
    dataAttrs?: Record<`data-${string}`, string | number | boolean>;
  }>(),
  {
    variant: "inline"
  }
);

const { message, meta } = useMessage(props.item);
</script>
