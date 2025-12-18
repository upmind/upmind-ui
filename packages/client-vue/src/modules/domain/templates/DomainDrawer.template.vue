<template>
  <slot name="domain-type" />

  <Drawer
    v-model:open="open"
    dismissible
    fit="cover"
    :dismissable="false"
    height="fixed"
    @open-auto-focus.prevent="onOpen"
    @close="onClose"
  >
    <template #header>
      <slot name="search" />
    </template>

    <div>
      <slot name="results" />
    </div>

    <template
      v-if="!isEmptySlot('cancel', slots) || !isEmptySlot('resolve', slots)"
      #footer
    >
      <slot name="cancel" />
      <slot name="resolve" />
    </template>
  </Drawer>
</template>

<script setup lang="ts">
// --- external
import { useSlots, ref } from "vue";
import { useFocus } from "@vueuse/core";

// --- internal
import { Drawer } from "@upmind-automation/upmind-ui";

// --- utils
import { isEmptySlot } from "@upmind-automation/upmind-ui";

defineOptions({
  inheritAttrs: false
});

const emit = defineEmits<{
  (e: "reset"): void;
}>();

const open = defineModel<boolean>("open");
const slots = useSlots();

const inputRef = ref<HTMLInputElement | null>(null);
const { focused } = useFocus(inputRef);

function onOpen() {
  inputRef.value = document.querySelector<HTMLInputElement>(
    "[vaul-drawer] input"
  );
  focused.value = true;
}

function onClose() {
  emit("reset");
}
</script>
