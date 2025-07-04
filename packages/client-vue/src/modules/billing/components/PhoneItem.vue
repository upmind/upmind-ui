<template>
  <div class="flex w-full flex-col gap-y-1">
    <header
      class="pointer-events-none flex w-full !cursor-pointer items-stretch justify-between"
    >
      <!-- <div class="pointer-events-none !cursor-pointer"> -->
      <span
        class="border-control flex w-24 items-center justify-center space-x-2 rounded-l-lg border border-r-0 text-sm"
      >
        <Avatar :icon="lowerCase(props.phone.country)" size="3xs" />
        <span class="text-emphasis-medium"
          >+{{ props.phone.countryCallingCode }}</span
        >
      </span>
      <InputExtended
        :model-value="props.phone.nationalNumber"
        type="tel"
        class="border-control !cursor-pointer rounded-l-none focus:outline-none disabled:opacity-100"
        disabled
      >
        <template #append>
          <Link
            v-if="!props.readonly"
            :label="t('client.phone.actions.edit')"
            size="xs"
            variant="muted"
            tabindex="-1"
            @mousedown.stop.prevent
            class="pointer-events-auto h-4"
            @click.stop.prevent="doEdit"
          />
        </template>
      </InputExtended>
    </header>
  </div>
</template>

<script setup lang="ts">
// --- external
import { useI18n } from "vue-i18n";

// --- components
import { Link, Avatar, InputExtended } from "@upmind-automation/upmind-ui";

// --- utils
import { lowerCase } from "lodash-es";

// --- types
import type { Phone } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const props = defineProps<
  Phone & {
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
