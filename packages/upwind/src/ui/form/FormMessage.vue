<template>
  <p
    :id="props.formMessageId"
    :name="toValue(props.name)"
    class="flex flex-col gap-1 text-sm font-medium text-destructive"
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

const props = defineProps<{
  name: string;
  formMessageId: string;
  class?: HTMLAttributes["class"];
  errors: string[] | string;
}>();

const safeErrors = computed(() =>
  isArray(props.errors) ? props.errors : [props.errors]
);
</script>
