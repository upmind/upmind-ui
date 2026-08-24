<template>
  <div class="flex w-full flex-col gap-1">
    <header class="flex w-full items-start justify-between">
      <h3 class="m-0 flex items-center gap-x-2 text-base font-medium">
        {{ title }}
        <Badge
          v-if="meta?.isDefault"
          appearance="outline"
          variant="neutral"
          size="sm"
        >
          {{ t("text.default_label") }}
        </Badge>
      </h3>

      <Link
        v-if="!props.readonly"
        :data-attrs="{ 'data-test-key': 'link-edit' }"
        size="sm"
        color="muted"
        tabindex="-1"
        @mousedown.stop.prevent
        @click.stop.prevent="doEdit"
        >{{ t("action.edit") }}</Link
      >
    </header>

    <p class="text-muted m-0 text-sm" v-if="description">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Link } from "@upmind/ui";
import { Badge } from "@upmind/ui";

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
