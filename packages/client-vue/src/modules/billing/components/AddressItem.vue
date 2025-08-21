<template>
  <div
    class="flex w-full flex-col gap-1"
    :class="!props.readonly && 'cursor-pointer!'"
  >
    <header class="flex w-full items-start justify-between">
      <h3 class="text-md m-0 flex items-center gap-x-2 font-medium">
        {{ title }}
        <Badge
          v-if="meta?.isDefault"
          variant="flat"
          size="sm"
          :label="t('client.address.default')"
        />
      </h3>

      <Button
        v-if="!props.readonly"
        :label="t('client.address.actions.edit')"
        size="sm"
        variant="link"
        color="muted"
        tabindex="-1"
        @mousedown.stop.prevent
        @click.stop.prevent="doEdit"
      />
    </header>

    <p class="text-emphasis-high m-0 text-sm">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";

// --- components
import { Button, Badge } from "@upmind-automation/upmind-ui";

// --- types
import type { Address } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const props = defineProps<
  Address & {
    readonly?: boolean;
  }
>();

const emits = defineEmits<{
  (e: "edit", id: string): void;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();

const doEdit = () => {
  if (!props?.id) return;
  emits("edit", props.id);
};
</script>
