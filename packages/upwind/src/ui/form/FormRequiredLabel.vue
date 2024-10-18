<template>
  <Label
    v-if="props.required"
    :class="cn('text-right', props.class)"
    :for="props.formItemId"
  >
    <slot>
      <!-- TODO: i18n, or do we want an icon here? -->
      <span class="text-xs opacity-50">Required</span>
    </slot>
  </Label>
</template>

<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { cn } from "../../utils";

import type { LabelProps } from "radix-vue";
import { Label } from "../label";

const props = defineProps<
  LabelProps & {
    formItemId: string;
    invalid?: boolean;
    class?: HTMLAttributes["class"];
    required?: boolean;
  }
>();
</script>
