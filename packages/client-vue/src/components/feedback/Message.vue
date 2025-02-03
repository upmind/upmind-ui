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
    @reject="dismiss()"
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
import { useTimestamp } from "@vueuse/core";
import { utils } from "@upmind-automation/headless";
import { endsWith, startsWith } from "lodash-es";

// -----------------------------------------------------------------------------

const props = defineProps({
  item: {
    type: Object, // xstate actor
    required: true,
  },
  scheduled: {
    type: Boolean,
    default: false,
  },
  anchor: {
    type: String,
  },
  variant: {
    type: String,
    default: "inline",
  },
  block: {
    type: Boolean,
    default: false,
  },
});

const { message, meta, dismiss } = useMessage(props.item);

const safeAnchor = computed(() => {
  return props.anchor || message.value?.anchor;
});
</script>
