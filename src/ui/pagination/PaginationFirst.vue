<script setup lang="ts">
import type { PaginationFirstProps } from "radix-vue";
import type { HTMLAttributes } from "vue";
import { Button } from "../button";
import { cn } from "../../utils";
import { ChevronsLeft } from "lucide-vue-next";
import { PaginationFirst } from "radix-vue";
import { computed } from "vue";

const props = withDefaults(
  defineProps<PaginationFirstProps & { class?: HTMLAttributes["class"] }>(),
  {
    asChild: true
  }
);

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});
</script>

<template>
  <PaginationFirst v-bind="delegatedProps">
    <Button :class="cn('h-10 w-10 p-0', props.class)" variant="outline">
      <slot>
        <ChevronsLeft class="h-4 w-4" />
      </slot>
    </Button>
  </PaginationFirst>
</template>
