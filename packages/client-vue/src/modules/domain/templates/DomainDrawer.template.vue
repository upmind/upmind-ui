<template>
  <slot name="domain-type" />

  <Drawer
    v-model:open="internalOpen"
    :dismissible="!props.loading"
    fit="cover"
    height="fixed"
    :title="t('domain.search')"
    :description="t('domain.domain_description')"
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
import { useSlots, ref, computed } from "vue";
import { useFocus } from "@vueuse/core";
import { useI18n } from "vue-i18n";

// --- internal
import { Drawer } from "@upmind-automation/upmind-ui";

// --- utils
import { isEmptySlot } from "@upmind-automation/upmind-ui";

defineOptions({
  inheritAttrs: false
});

const emit = defineEmits<{
  (e: "reset"): void;
  (e: "update:open", value: boolean): void;
}>();

const props = defineProps<{
  open?: boolean;
  loading?: boolean;
}>();

const { t } = useI18n();
const slots = useSlots();

const internalOpen = computed({
  get: () => props.open,
  set: value => {
    // Only allow closing if not loading
    if (value === false && props.loading) {
      return;
    }
    emit("update:open", value);
  }
});

const inputRef = ref<HTMLInputElement | null>(null);
const { focused } = useFocus(inputRef);

function onOpen() {
  inputRef.value = document.querySelector<HTMLInputElement>(
    "[vaul-drawer] input"
  );
  focused.value = true;
}

function onClose() {
  if (!props.loading) {
    emit("reset");
  }
}
</script>
