<template>
  <div class="text-base-foreground flex items-start gap-2 leading-tight">
    <span class="text-secondary flex-shrink-0">
      <Icon
        :icon="icon.icon && !iconError ? icon.icon : 'dot'"
        class="size-5"
        @error="iconError = true"
      />
    </span>

    <p class="m-0">{{ label }}</p>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { Icon, type IconProps } from "@upmind-automation/upwind";

const iconError = ref(false);

defineProps<{
  label: string;
  icon: IconProps;
}>();
</script>
