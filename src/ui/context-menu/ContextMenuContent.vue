<script lang="ts" setup>
import {
  ContextMenuContent,
  type ContextMenuContentEmits,
  type ContextMenuContentProps,
  ContextMenuPortal,
  useForwardPropsEmits
} from "radix-vue";
import { type HTMLAttributes, computed } from "vue";
import { cn, usePortalTarget, type PortalTarget } from "../../utils";

const props = defineProps<
  ContextMenuContentProps & {
    class?: HTMLAttributes["class"];
    to?: PortalTarget;
  }
>();
const emits = defineEmits<ContextMenuContentEmits>();

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props;

  return delegated;
});

const forwarded = useForwardPropsEmits(delegatedProps, emits);

const portalTo = usePortalTarget(() => props.to);
</script>

<template>
  <ContextMenuPortal :to="portalTo">
    <ContextMenuContent
      v-bind="forwarded"
      :class="
        cn(
          'control-radius border-control-default bg-control-surface text-display shadow-control-default animate-in fade-in-80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-32 overflow-hidden border p-1',
          props.class
        )
      "
    >
      <slot />
    </ContextMenuContent>
  </ContextMenuPortal>
</template>
