<script lang="ts" setup>
import {
  ComboboxContent,
  ScrollAreaRoot,
  ScrollAreaViewport,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  useForwardPropsEmits
} from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn } from "../../utils";
import type { ComboboxContentEmits, ComboboxContentProps } from "radix-vue";

const props = withDefaults(
  defineProps<
    ComboboxContentProps & {
      class?: HTMLAttributes["class"];
      scrollbarClass?: HTMLAttributes["class"];
      scrollbarThumbClass?: HTMLAttributes["class"];
    }
  >(),
  {
    dismissable: false
  }
);
const emits = defineEmits<ComboboxContentEmits>();

const delegatedProps = computed(() => {
  const {
    class: _,
    scrollbarClass: _s,
    scrollbarThumbClass: _st,
    ...delegated
  } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <ComboboxContent
    v-bind="forwarded"
    :class="cn('max-h-[300px] overflow-hidden', props.class)"
  >
    <ScrollAreaRoot type="auto" class="flex h-full max-h-[300px] flex-col">
      <ScrollAreaViewport>
        <div role="presentation">
          <slot />
        </div>
      </ScrollAreaViewport>
      <ScrollAreaScrollbar orientation="vertical" :class="props.scrollbarClass">
        <ScrollAreaThumb :class="props.scrollbarThumbClass" />
      </ScrollAreaScrollbar>
    </ScrollAreaRoot>
  </ComboboxContent>
</template>
