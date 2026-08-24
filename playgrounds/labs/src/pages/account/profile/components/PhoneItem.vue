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
          appearance="solid"
          variant="neutral"
          size="sm"
          :label="t('text.default_label')"
        />
      </h3>

      <div>
        <Link
          v-if="!props.readonly"
          :label="t('action.edit')"
          size="sm"
          color="muted"
          tabindex="-1"
          @mousedown.stop.prevent
          @click.stop.prevent="doEdit"
        />
        <Link
          v-if="!props.readonly && !meta?.isDefault"
          :label="t('action.remove')"
          size="sm"
          color="muted"
          tabindex="-1"
          @mousedown.stop.prevent
          class="pointer-events-auto ml-2 h-4"
          @click.stop.prevent="doDelete"
        />
        <Link
          v-if="!props.readonly && !meta?.isDefault"
          :label="t('action.set_as_default')"
          size="sm"
          color="muted"
          tabindex="-1"
          @mousedown.stop.prevent
          class="pointer-events-auto ml-2 h-4"
          @click.stop.prevent="setDefault"
        />
      </div>
    </header>

    <p class="text-muted m-0 text-sm">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Badge, Link } from "@upmind/ui";
import type { Phone } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const props = defineProps<
  Phone & {
    readonly?: boolean;
  }
>();

const emits = defineEmits<{
  (e: "edit", id: string): void;
  (e: "remove", id: string): void;
  (e: "setDefault", id: string): void;
}>();

// -----------------------------------------------------------------------------

const { t } = useI18n();

const doEdit = () => {
  if (!props?.id) return;
  emits("edit", props.id);
};

const doDelete = () => {
  if (!props?.id) return;
  emits("remove", props.id);
};

const setDefault = () => {
  if (!props?.id) return;
  emits("setDefault", props.id);
};
</script>
