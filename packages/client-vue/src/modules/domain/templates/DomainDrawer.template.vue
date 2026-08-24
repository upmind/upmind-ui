<template>
  <slot name="domain-type" />

  <!-- Stable full height (capped) so the drawer doesn't resize between the
       loader and the results. The composed Drawer renders the title and
       description sr-only because #header replaces the visible block. -->
  <Drawer
    v-model:open="internalOpen"
    :dismissible="!props.loading"
    :title="t('domain.search')"
    :description="t('domain.domain_description')"
    class="h-[calc(100dvh-6rem)]"
    @open-auto-focus.prevent="onOpen"
    :ui="{
      header: 'mx-auto w-full max-w-app md:px-6 lg:px-18',
      body: 'mx-auto flex w-full max-w-app flex-col md:px-6 lg:px-18',
      footer:
        'mx-auto w-full max-w-app md:px-6 lg:px-18 lg:flex-row lg:justify-between'
    }"
  >
    <template #header>
      <slot name="search" />
    </template>

    <slot name="results" />

    <template v-if="meta.hasFooterActions" #footer>
      <slot name="cancel" />
      <slot name="resolve" />
    </template>
  </Drawer>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useFocus } from "@vueuse/core";
import { useI18n } from "vue-i18n";
import { Drawer, useSlots } from "@upmind/ui";
import { isEmptySlot } from "../../../utils/isEmptySlot";

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

const meta = computed(() => ({
  hasFooterActions:
    !isEmptySlot("cancel", slots) || !isEmptySlot("resolve", slots)
}));

const internalOpen = computed({
  get: () => props.open,
  set: value => {
    // vaul fires an open-change echo on mount; ignore the no-op so a freshly
    // mounted (still-closed) drawer doesn't trigger a spurious close → reset.
    if (value === props.open) return;
    // Only allow closing if not loading
    if (value === false && props.loading) return;
    emit("update:open", value);
    if (value === false) onClose();
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
