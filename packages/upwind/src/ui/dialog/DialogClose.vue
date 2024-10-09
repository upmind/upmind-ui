<script lang="ts" setup>
import { DialogClose, type DialogCloseProps } from "radix-vue";
import { Button } from "../button";
import { Icon } from "../icon";
const props = defineProps<DialogCloseProps>();
</script>

<template>
  <DialogClose v-bind="props" :as="Button" size="icon" variant="ghost">
    <slot>
      <Icon icon="close" size="auto" />
      <span class="sr-only">Close</span>
    </slot>
  </DialogClose>
</template>
