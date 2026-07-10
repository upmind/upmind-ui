<template>
  <div
    v-bind="cardTestAttrs"
    class="flex w-full flex-col gap-1"
    :class="!props.readonly && 'cursor-pointer!'"
  >
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
        size="sm"
        color="muted"
        tabindex="-1"
        :dataAttrs="{ 'data-test-key': 'link-edit' }"
        @mousedown.stop.prevent
        @click.stop.prevent="doEdit"
      />
    </header>

    <p class="text-muted m-0 text-sm">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Badge, Link, useTestAttrs } from "@upmind-automation/upmind-ui";
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

const cardTestAttrs = useTestAttrs({ key: "address-card" });

const doEdit = () => {
  if (!props?.id) return;
  emits("edit", props.id);
};
</script>
