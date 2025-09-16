<template>
  <div class="flex w-full flex-col gap-1">
    <header class="flex w-full items-start justify-between">
      <h3 class="text-md m-0 flex items-center gap-x-2 font-medium">
        {{ title }}
        <Badge
          v-if="meta?.isDefault"
          variant="flat"
          size="sm"
          :label="t(`${i18nKey ?? 'manage'}.default`)"
        />
      </h3>

      <Button
        v-if="!props.readonly"
        :label="t(`${i18nKey ?? 'manage'}.actions.edit`)"
        size="sm"
        variant="link"
        color="muted"
        tabindex="-1"
        @mousedown.stop.prevent
        @click.stop.prevent="doEdit"
      />
    </header>

    <p class="text-emphasis-high m-0 text-sm" v-if="description">
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

// -----------------------------------------------------------------------------

const props = defineProps<{
  i18nKey?: string;
  readonly?: boolean;
  id: string;
  title: string;
  description?: string;
  meta?: {
    isDefault?: boolean;
  };
}>();

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
