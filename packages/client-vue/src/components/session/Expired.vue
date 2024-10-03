<template>
  <component
    v-if="modal || (!modal && isOpen)"
    :is="modal ? Dialog : 'div'"
    :description="text"
    :open="isOpen"
    :title="title"
    fit="cover"
    no-header
    no-close
    persistent
    size="xl"
    skrim="light"
  >
    <template #header>
      <div />
    </template>

    <section
      class="text-primary relative flex w-full flex-col flex-wrap items-center justify-center gap-4 py-6 text-center"
    >
      <Avatar v-bind="avatar" />

      <h3 class="text-primary m-0 text-center text-3xl">
        {{ title }}
      </h3>

      <p
        class="text-base-500 m-0 mb-4 text-center text-sm leading-5 tracking-tight"
      >
        {{ text }}
      </p>

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

<script lang="ts" setup>
// --- external
import { ref, computed, watch } from "vue";

// --- internal
import { useSession } from "@upmind/headless-vue";

// --- components
import { Avatar, Dialog, Button } from "@upmind/upwind";

// --- utils
import { isEmpty, isFunction } from "lodash-es";

// --- types
// -----------------------------------------------------------------------------
interface ExpiredProps {
  modal?: boolean;
  title?: string;
  text?: string;
  avatar?: {
    size?: string;
    shape?: string;
    color?: string;
    icon?: string;
    fit?: string;
  };
  action?: {
    label?: string;
    color?: string;
    handler?: () => void;
    auto?: boolean;
  };
}

const props = withDefaults(defineProps<ExpiredProps>(), {
  modal: true,
  avatar: () => ({
    size: "md",
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
