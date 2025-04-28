<template>
  <div :class="styles.clientCard.root">
    <div :class="styles.clientCard.content" @click="onSelect">
      <header :class="styles.clientCard.header">
        <h4 :class="styles.clientCard.title">
          {{ title }}

          <template v-for="(badge, index) in badges" :key="`badge-${index}`">
            <Badge v-bind="badge" />
          </template>
        </h4>
      </header>

      <span
        v-for="(line, index) in description?.split(';')"
        :class="styles.clientCard.text"
        :key="`line-${index}`"
        >{{ line }}</span
      >

      <p v-if="meta.hasErrors" :class="styles.clientCard.errors">
        {{ errors }}
      </p>
    </div>

    <footer :class="styles.clientCard.actions">
      <DropdownMenu v-if="!noActions" :items="actions" size="sm" />
    </footer>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed, inject } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../client.config";

// --- components
import { DropdownMenu } from "@upmind-automation/upmind-ui";

// --- custom elements
import { Badge } from "@upmind-automation/upmind-ui";

// --- utils
import { useClipboard } from "@vueuse/core";

// ---types
import type { ClientComposables } from "@upmind-automation/headless-vue";
import type {
  BadgeProps,
  DropdownMenuItemProps,
} from "@upmind-automation/upmind-ui";
import type { ComputedRef } from "vue";
import type { ActorRef } from "xstate";

// -----------------------------------------------------------------------------
const emit = defineEmits<{
  (e: "update:modelValue", payload: any): void;
  (e: "click:action", payload: any): void;
}>();

const props = withDefaults(
  defineProps<{
    modelValue: ActorRef<any>;
    i18nKey: string;
    selected?: boolean;
    loading?: boolean;
    hidden?: boolean;
    disabled?: boolean;
    noActions?: boolean;
    selectable?: boolean;
  }>(),
  {
    i18nKey: "",
    selected: false,
    loading: false,
    hidden: false,
    disabled: false,
    noActions: false,
    selectable: true,
  }
);

const { t } = useI18n();

const useClient = inject("client") as ClientComposables["useClientItem"];

const { errors, select, meta, setDefault, edit, remove, title, description } =
  useClient(props.modelValue, props);

const styles = useStyles(["clientCard"], meta, config) as ComputedRef<{
  clientCard: {
    root: string;
    header: string;
    content: string;
    title: string;
    text: string;
    errors: string;
    actions: string;
  };
}>;

// ------------------------------------------------

const { isSupported, copy, copied } = useClipboard();
// ------------------------------------------------

const badges = computed((): BadgeProps[] => {
  const badges: BadgeProps[] = [];
  if (meta.value.type)
    badges.push({
      label: t(`client.${props.i18nKey}.badges.${meta.value.type}`),
      variant: "tonal",
      color: "base",
    });

  if (meta.value.isDefault)
    badges.push({
      label: t(`client.${props.i18nKey}.badges.default`),
      variant: "tonal",
      color: "base",
    });

  return badges;
});

const actions = computed((): DropdownMenuItemProps[] => {
  return [
    {
      label: t(`client.${props.i18nKey}.actions.select`),
      value: "select",
      hidden: meta.value.isDefault, //|| !meta.isVerified,
      icon: "check-square",
      handler: () => {
        setDefault();
      },
    },
    {
      icon: "edit",
      label: t(`client.${props.i18nKey}.actions.edit`),
      value: "edit",
      handler: () => {
        edit();
      },
    },
    {
      icon: "remove",
      label: t(`client.${props.i18nKey}.actions.delete`),
      value: "delete",
      hidden: !meta.value.canRemove,
      class:
        "text-destructive data-[highlighted]:bg-destructive-muted data-[highlighted]:text-destructive",

      handler: () => {
        remove();
      },
    },
  ];
});

function onSelect() {
  emit("update:modelValue", props.modelValue);
  select();
}
</script>
