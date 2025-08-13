<template>
  <p
    :id="props.formMessageId"
    :name="toValue(props.name)"
    :class="
      cn(
        'text-control-error flex w-full flex-col gap-1 text-sm font-medium',
        props.class
      )
    "
  >
    <template v-if="props.showAllErrors">
      <span v-for="(error, index) in safeErrors" :key="`error-${index}`">
        {{ error }}
      </span>
    </template>
    <span v-else>
      {{ first(safeErrors) }}
    </span>
  </p>
</template>

<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { toValue, computed } from "vue";
import { isArray, first } from "lodash-es";
import { cn } from "../../utils";

const props = defineProps<{
  formMessageId: string;
  name: string;
  errors: string[] | string;
  class?: HTMLAttributes["class"];
  showAllErrors?: boolean;
}>();

const safeErrors = computed(() =>
  isArray(props.errors) ? props.errors : [props.errors]
);
</script>
