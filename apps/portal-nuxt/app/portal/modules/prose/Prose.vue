<template>
  <EmptyState
    v-if="meta.isEmpty"
    :title="props.emptyTitle"
    :description="props.emptyDescription"
  />

  <ClampText
    v-else-if="meta.isMarkdown"
    :lines="props.lines"
    :show-more-label="props.showMoreLabel ?? ''"
    :show-less-label="props.showLessLabel ?? ''"
    v-bind="useTestAttrs({ key: 'portal-prose' })"
  >
    <Markdown
      tag="div"
      :model-value="props.markdown"
      :class="PROSE_BODY_CLASS"
    />
  </ClampText>

  <div
    v-else
    :class="PROSE_FRAMES_CLASS"
    v-bind="useTestAttrs({ key: 'portal-prose-frames' })"
  >
    <div
      v-for="frame in props.frames"
      :key="frame.url"
      :class="PROSE_FRAME_CLASS"
    >
      <span :class="PROSE_FRAME_TITLE_CLASS">{{ frame.title }}</span>
      <iframe
        :src="frame.url"
        :title="frame.title"
        loading="lazy"
        referrerpolicy="no-referrer"
        sandbox="allow-scripts allow-forms allow-same-origin"
        :class="PROSE_FRAME_BODY_CLASS"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/prose/Prose
 * @description The `prose` module — brand-authored markdown (clamped, with
 * the library's own Show-more control) and the provider panels embedded
 * beside it. Renders what it is given; it never fetches, and it never decides
 * which of the two it is showing beyond the variant it was handed.
 *
 * The frames are real `iframe`s rather than sanitised HTML: `Sanitized` runs
 * DOMPurify, which strips the tag by design. They are sandboxed and
 * referrer-free, because a provider panel is somebody else's page.
 */
import { ClampText, EmptyState, Markdown, useTestAttrs } from "@upmind/ui";
import { computed } from "vue";
import { PROSE_MODULE_VARIANT } from "./types";
import {
  PROSE_BODY_CLASS,
  PROSE_FRAMES_CLASS,
  PROSE_FRAME_BODY_CLASS,
  PROSE_FRAME_CLASS,
  PROSE_FRAME_TITLE_CLASS
} from "./variants";
import { size } from "lodash-es";
import type { ProseModuleProps } from "./types";

defineOptions({ name: "PortalProse" });

const props = defineProps<ProseModuleProps>();

const meta = computed(() => {
  const isMarkdown = props.variant !== PROSE_MODULE_VARIANT.FRAMES;
  const hasMarkdown = (props.markdown ?? "") !== "";
  const hasFrames = size(props.frames) > 0;
  let isEmpty = !hasFrames;
  if (isMarkdown) isEmpty = !hasMarkdown;
  return { isMarkdown, isEmpty };
});
</script>
