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
          variant="solid"
          color="neutral"
          size="sm"
          :label="t('text.default_label')"
        />
        <Badge
          v-if="!meta?.isVerified"
          variant="solid"
          color="danger"
          size="sm"
          :label="t('text.unverified_label')"
        />

        <Tooltip
          v-if="meta?.isBounced"
          :label="t('text.bounced_msg', { datetime: props.bouncedAt?.date })"
          side="right"
          color="warning"
          class="control-radius max-w-72 text-center text-xs"
        >
          <Badge
            variant="solid"
            color="warning"
            size="sm"
            :label="t('text.bounced_label')"
          />
        </Tooltip>
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
        <Link
          v-if="!props.readonly && !meta?.isVerified"
          :label="t('action.verify')"
          size="sm"
          color="muted"
          tabindex="-1"
          @mousedown.stop.prevent
          class="pointer-events-auto ml-2 h-4"
          @click.stop.prevent="doVerify"
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
import { Badge, Link, Tooltip } from "@upmind-automation/upmind-ui";
import type { Email } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

const props = defineProps<
  Email & {
    readonly?: boolean;
  }
>();

const emits = defineEmits<{
  (e: "edit", id: string): void;
  (e: "remove", id: string): void;
  (e: "verify", id: string): void;
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

const doVerify = () => {
  if (!props?.id) return;
  emits("verify", props.id);
};

const setDefault = () => {
  if (!props?.id) return;
  emits("setDefault", props.id);
};
</script>
