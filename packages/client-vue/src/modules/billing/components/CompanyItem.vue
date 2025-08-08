<template>
  <div class="flex w-full flex-col gap-y-1">
    <header
      class="pointer-events-none flex w-full !cursor-pointer items-start justify-between"
    >
      <h3 class="m-0 flex items-center gap-x-2 text-sm font-semibold">
        {{ title }}
        <Badge
          v-if="meta?.isDefault"
          variant="flat"
          size="xs"
          :label="t('client.company.default')"
        />
      </h3>

      <Link
        v-if="!props.readonly"
        :label="t('client.company.actions.edit')"
        size="xs"
        variant="muted"
        tabindex="-1"
        @mousedown.stop.prevent
        class="pointer-events-auto h-4"
        @click.stop.prevent="doEdit"
      />
    </header>

    <p class="text-emphasis-high m-0 text-sm">
      {{ description }}
    </p>

    <p
      v-if="regNumber || vatNumber"
      class="text-emphasis-medium m-0 inline-flex flex-wrap gap-x-1 text-sm"
    >
      {{ t("client.company.details", { title, regNumber, vatNumber }) }}
    </p>
  </div>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";

// --- components
import { Link, Badge } from "@upmind-automation/upmind-ui";

// --- types
import type { Company } from "@upmind-automation/headless";
import type { register } from "module";

// -----------------------------------------------------------------------------

const props = defineProps<
  Company & {
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
