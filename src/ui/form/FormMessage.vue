<template>
  <p
    :id="props.formMessageId"
    :name="toValue(props.name)"
    :class="
      cn(
        'flex w-full flex-col gap-1 text-sm font-medium text-control-error',
        props.class
      )
    "
  >
    <span v-for="(error, index) in safeErrors" :key="`error-${index}`">
      {{ error }}
    </span>
  </p>
</template>

<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { toValue, computed } from "vue";
import { isArray } from "lodash-es";
import { cn } from "../../utils";

const props = defineProps<{
  formMessageId: string;
  name: string;
  errors: string[] | string;
  class?: HTMLAttributes["class"];
}>();

const safeErrors = computed(() =>
  isArray(props.errors) ? props.errors : [props.errors]
);
</script>
