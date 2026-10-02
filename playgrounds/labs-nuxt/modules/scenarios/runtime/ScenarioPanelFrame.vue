<template>
  <slot />
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/runtime/ScenarioPanelFrame
 * @description Gives everything drawn under it one panel's namespace. An area
 * stacks several panels on one page, and each owns the same url params (`track`,
 * `sort`, `limit`, `filter.*`) and the same stage; the namespace this provides
 * is what keeps them apart (`usePlaygroundUrlState`, `useScenarioStage`).
 *
 * It must be a PARENT of the panel rather than the panel itself: a component
 * injects from its ancestors, so a panel providing its own namespace could not
 * read it in its own setup, where the criteria sync and the transport are built.
 */

import { provide } from "vue";
import { PLAYGROUND_URL_NAMESPACE } from "../../../app/composables/usePlaygroundUrlState.types";
import type { ScenarioPanelFrameProps } from "./ScenarioPanelFrame.types";

// -----------------------------------------------------------------------------

const props = defineProps<ScenarioPanelFrameProps>();

provide(PLAYGROUND_URL_NAMESPACE, props.namespace);
</script>
