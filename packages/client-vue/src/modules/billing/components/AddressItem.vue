<template>
  <div
    v-bind="cardTestAttrs"
    class="flex w-full flex-col gap-1"
    :class="!props.readonly && 'cursor-pointer!'"
  >
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
        size="sm"
        color="muted"
        tabindex="-1"
        :data-attrs="{ 'data-test-key': 'link-edit' }"
        @mousedown.stop.prevent
        @click.stop.prevent="doEdit"
        >{{ t("action.edit") }}</Link
      >
    </header>

    <p class="text-muted m-0 text-sm">
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useTestAttrs } from "@upmind/ui";
import { Link } from "@upmind/ui";
import { Badge } from "@upmind/ui";
import { useI18n } from "vue-i18n";
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
