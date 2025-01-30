<template>
  <component
    v-if="(modal && isOpen) || !modal"
    :is="modal ? Dialog : 'div'"
    :description="text"
    :open="isOpen"
    :size="size"
    :skrim="skrim"
    :title="title"
    fit="cover"
    :to="modal ? 'main' : ''"
    no-close
    no-header
    :dismissable="false"
  >
    <template #header>
      <div />
    </template>

    <section :class="styles.session.expired.root">
      <Avatar v-bind="avatar" />

      <h3 :class="styles.session.expired.title">{{ title }}</h3>

      <p :class="styles.session.expired.text">{{ text }}</p>

      <footer>
        <Button
          v-if="hasAction"
          v-bind="action"
          @click.stop="doAction"
          :loading="processing"
        />
      </footer>
    </section>
  </component>
</template>

<!-- eslint-disable vue/component-api-style -->
<script lang="ts" setup>
// --- external
import { ref, computed, watch } from "vue";

// --- internal
import { useSession } from "@upmind-automation/headless-vue";
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./config.cva";

// --- components
import { Avatar, Dialog, Button } from "@upmind-automation/upmind-ui";

// --- utils
import { isEmpty, isFunction } from "lodash-es";

// --- types
import type { SessionExpiredProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<SessionExpiredProps>(), {
  modal: true,
  skrim: "primary",
  size: "2xl",
  avatar: () => ({
    size: "lg",
    shape: "circle",
    color: "primary",
    icon: "basket",
    fit: "contain",
  }),
  action: () => ({
    label: "Reload",
    color: "base",
    handler: () => window.location.reload(),
    auto: false,
  }),
});

const { meta } = useSession();

const styles = useStyles(["session.expired"], meta, config);

const processing = ref(false);
const isOpen = computed(() => meta.value.hasExpired && !props.action?.auto);
const hasAction = computed(() => {
  return !isEmpty(props.action);
});

async function doAction() {
  if (isFunction(props.action?.handler)) {
    processing.value = true;
    await props.action.handler();
    processing.value = false;
  }
}

watch(meta, ({ hasExpired }) => {
  if (props.action?.auto && hasExpired) doAction();
});
</script>
