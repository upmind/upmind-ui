<template>
  <div class="flex w-full flex-col gap-1">
    <header class="flex w-full items-start justify-between">
      <h3 class="text-md m-0 flex items-center gap-x-2 font-medium">
        {{ title }}
        <Badge
          v-if="meta?.isDefault"
          variant="minimal"
          color="neutral"
          size="sm"
          :label="t('text.default_label')"
        />
      </h3>

      <Link
        v-if="!props.readonly"
        :label="t('action.edit')"
        :data-attrs="{ 'data-test-key': 'link-edit' }"
        size="sm"
        color="muted"
        tabindex="-1"
        @mousedown.stop.prevent
        @click.stop.prevent="doEdit"
      />
    </header>

    <p class="text-muted m-0 text-sm" v-if="description">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Link, Badge } from "@upmind-automation/upmind-ui";

// --- types

// -----------------------------------------------------------------------------

const props = defineProps<{
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
