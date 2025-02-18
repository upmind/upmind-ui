<template>
  <Alert
    v-bind="message"
    :model-value="meta.isActive || (scheduled && meta.isScheduled)"
    :icon="message.value.icon"
    :title="message.value.title"
    :description="message.value.copy"
    :data="message.value.data"
    :color="message.value.type"
    :anchor="safeAnchor"
    :variant="variant"
    @reject="dismiss"
  />
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import { useMessage } from "@upmind-automation/headless-vue";

// custom elements
import { Alert } from "@upmind-automation/upmind-ui";

// --- utils

// -----------------------------------------------------------------------------
const props = withDefaults(
  defineProps<{
    item: object; // xstate actor
    scheduled?: boolean;
    anchor?: string;
    variant?: string;
    block?: boolean;
  }>(),
  {
    variant: "inline",
  }
);

const { message, meta, dismiss } = useMessage(props.item);

const safeAnchor = computed(() => {
  return props.anchor || message.value?.anchor;
});
</script>
