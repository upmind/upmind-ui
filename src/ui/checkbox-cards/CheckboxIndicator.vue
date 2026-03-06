<template>
  <span
    class="size-lh text-md-tight flex items-center justify-center"
    :class="props.noInput ? 'sr-only' : ''"
  >
    <span
      :class="
        cn(
          'group-focus-visible:ring-control-ring group-focus:ring-control-ring group-active:ring-control-ring outline-hidden group-focus:ring-2 group-focus:ring-offset-2 group-focus-visible:ring-2 group-focus-visible:ring-offset-2 group-active:ring-2 group-data-[disabled]:ring-0 group-data-[disabled]:ring-offset-0',
          'ring-offset-control-surface',
          'data-[state=unchecked]:shadow-control-default data-[state=checked]:shadow-control-checked text-primary aspect-square h-4 w-4 rounded-sm group-data-[disabled]:cursor-not-allowed group-data-[disabled]:opacity-50',
          'text-control-foreground data-[state=checked]:bg-control-checked data-[state=unchecked]:group-hover:shadow-control-hover group-data-[disabled]:group-hover:shadow-control-default flex shrink-0 cursor-pointer items-center justify-center transition-none duration-0'
        )
      "
      :data-state="props.checked ? 'checked' : 'unchecked'"
      :data-hover="props.dataHover"
      :data-focus="props.dataFocus"
    >
      <Check class="text-control-checked-contrast h-3 w-3" />
    </span>
  </span>
</template>

<script setup lang="ts">
import { Check } from "lucide-vue-next";
import { cn } from "../../utils";

const props = defineProps<{
  checked?: boolean;
  noInput?: boolean;
  dataHover?: boolean;
  dataFocus?: boolean;
}>();
</script>
