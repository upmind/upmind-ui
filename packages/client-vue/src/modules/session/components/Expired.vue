<template>
  <!-- Modal: a blocking dialog the user can't dismiss (session expired → must act) -->
  <DialogRoot v-if="modal" :open="isOpen">
    <DialogContent
      :close-label="t('action.close')"
      class="items-center gap-6 py-16 text-center"
      hide-close
      @escape-key-down.prevent
      @pointer-down-outside.prevent
      @interact-outside.prevent
    >
      <Avatar
        size="lg"
        class="size-20 p-2"
        :ui="{ fallback: 'bg-primary text-primary-contrast' }"
      >
        <template #fallback>
          <Icon :icon="avatar.icon ?? 'basket'" />
        </template>
      </Avatar>

      <DialogTitle class="m-0 text-center text-3xl font-light text-inherit">
        {{ title }}
      </DialogTitle>

      <DialogDescription
        class="text-muted m-0 text-center text-sm leading-5 tracking-tight"
      >
        {{ text }}
      </DialogDescription>

      <footer v-if="hasAction">
        <Button
          :variant="action.color ?? 'primary'"
          :disabled="action.disabled"
          :loading="processing"
          size="lg"
          @click.stop="doAction"
        >
          <Icon v-if="action.icon" :icon="action.icon" />
          {{ action.label }}
        </Button>
      </footer>
    </DialogContent>
  </DialogRoot>

  <!-- Inline: rendered bare when not used as a modal -->
  <section
    v-else
    class="relative flex w-full flex-col flex-wrap items-center justify-center gap-6 py-16"
  >
    <Avatar
      size="lg"
      class="size-20 p-2"
      :ui="{ fallback: 'bg-primary text-primary-contrast' }"
    >
      <template #fallback>
        <Icon :icon="avatar.icon ?? 'basket'" />
      </template>
    </Avatar>

    <h3 class="m-0 text-center text-3xl font-light text-inherit">
      {{ title }}
    </h3>

    <p class="text-muted m-0 text-center text-sm leading-5 tracking-tight">
      {{ text }}
    </p>

    <footer v-if="hasAction">
      <Button
        :variant="action.color ?? 'primary'"
        :disabled="action.disabled"
        :loading="processing"
        size="lg"
        @click.stop="doAction"
      >
        <Icon v-if="action.icon" :icon="action.icon" />
        {{ action.label }}
      </Button>
    </footer>
  </section>
</template>

<script lang="ts" setup>
import {
  DialogContent,
  DialogDescription,
  DialogRoot,
  DialogTitle
} from "@upmind/ui";
import { Avatar, Button } from "@upmind/ui";
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useActiveSession } from "@upmind-automation/headless";
import { Icon } from "../../../components/icon";
import { isEmpty, isFunction } from "lodash-es";
import type { SessionExpiredProps } from "../types";
// -----------------------------------------------------------------------------

const { t } = useI18n();
const props = withDefaults(defineProps<SessionExpiredProps>(), {
  modal: true,
  size: "2xl",
  avatar: () => ({
    size: "lg",
    shape: "circle",
    color: "primary",
    icon: "basket",
    fit: "contain"
  }),
  action: () => ({
    label: "Reload",
    color: "primary",
    handler: () => window.location.reload(),
    auto: true
  })
});

const { isExpired } = useActiveSession().useMeta();

const processing = ref(false);
const isOpen = computed(() => isExpired.value && !props.action?.auto);
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

watch(isExpired, expired => {
  if (props.action?.auto && expired) doAction();
});
</script>
