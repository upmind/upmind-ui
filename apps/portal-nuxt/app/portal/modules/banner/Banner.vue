<template>
  <AnnouncementBar
    v-if="meta.isBanner && meta.hasMessage"
    :variant="props.tone"
    :dismissible="props.dismissible"
    :label="props.label"
    :dismiss-label="props.dismissLabel"
    @dismiss="onDismiss"
  >
    {{ props.message }}
    <template v-if="props.action" #action>
      <Button
        size="xs"
        variant="outline"
        @click="emits('select', props.action.value)"
        >{{ props.action.label }}</Button
      >
    </template>
  </AnnouncementBar>

  <Alert
    v-else-if="meta.hasMessage"
    :variant="props.tone"
    :title="props.title"
    :description="props.message"
  >
    <template v-if="props.action" #action>
      <Button
        size="xs"
        variant="outline"
        @click="emits('select', props.action.value)"
        >{{ props.action.label }}</Button
      >
    </template>
  </Alert>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/banner/Banner
 * @description The `banner` module (tasks.md 5.3, `status`-tagged) —
 * Banner/Notice: a page-level announcement over `@upmind/ui`'s
 * `AnnouncementBar`, or an in-content notice over its `Alert`. Message, title
 * and tone are config-owned data (`ModuleRef.props`), never hardcoded here.
 */
import { Alert, AnnouncementBar, Button } from "@upmind/ui";
import { computed } from "vue";
import { BANNER_VARIANT } from "./types";
import { isEmpty, trim } from "lodash-es";
import type { BannerModuleEmits, BannerModuleProps } from "./types";

defineOptions({ name: "PortalBanner" });

const props = defineProps<BannerModuleProps>();
const emits = defineEmits<BannerModuleEmits>();

function onDismiss(): void {
  if (props.dismissValue === undefined) return;
  emits("select", props.dismissValue);
}

const meta = computed(() => ({
  isBanner: props.variant === BANNER_VARIANT.BANNER,
  // A data-fed message resolves empty once its condition clears ("nothing
  // needs the user"), so neither form renders — a titled band with a blank
  // body and a live button reads as a bug.
  hasMessage: !isEmpty(trim(props.message))
}));
</script>
