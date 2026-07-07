<template>
  <div :class="cn(styles.input.container, props.class)">
    <slot name="prepend">
      <InputItems
        :icon="props.icon"
        :avatar="props.avatar"
        :ui-config="{ input: { items: props.uiConfig?.input?.items } }"
      />
    </slot>

    <slot v-bind="{ modelValue, styles, delegatedProps }">
      <input
        ref="input"
        v-bind="delegatedProps"
        v-model="modelValue"
        :class="styles.input.field"
      />
    </slot>

    <slot name="append">
      <InputItems
        :icon="props.iconAppend"
        :avatar="props.avatarAppend"
        :ui-config="{ input: { items: props.uiConfig?.input?.items } }"
      />
    </slot>
  </div>
</template>

<script lang="ts" setup>
import IMask, { type InputElement } from "imask";
import { useTemplateRef, computed, onMounted, watch, ref } from "vue";
import config from "./input.config";
import InputItems from "./InputItems.vue";
import { useStyles, cn, useTestAttrs } from "../../utils";
import { kebabCase, omit } from "lodash-es";
import type { InputProps } from "./types";
import type { InputMask } from "imask";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<InputProps>(), {
  width: "full",
  ring: true,
  // ---
  uiConfig: () => ({ input: {} }),
  class: ""
});

const input = useTemplateRef<InputElement>("input");
const modelValue = defineModel<InputProps["modelValue"]>("modelValue", {});

const delegatedProps = computed(() => {
  return {
    ...omit(props, [
      "class",
      "uiConfig",
      "defaultValue",
      "modelValue",
      "width",
      "size",
      "icon",
      "avatar",
      "iconAppend",
      "avatarAppend",
      "autoFocus",
      "mask",
      "ring"
    ]),
    ...testAttrs
  } as Record<string, unknown>;
});

const testAttrs = useTestAttrs({
  key: "input",
  value: [props.id, props.type, kebabCase(props.name)]
});

const meta = computed(() => ({
  width: props.width,
  hasRing: props.ring
}));

const styles = useStyles(
  ["container", "input"],
  meta,
  config,
  props.uiConfig ?? {}
);

const maskedInstance = ref<InputMask<string> | null>(null);

onMounted(() => {
  applyMask();
});

watch(
  () => props.mask,
  () => {
    if (maskedInstance.value) {
      maskedInstance.value.destroy();
      maskedInstance.value = null;
    }
    applyMask();
  }
);

function applyMask() {
  if (props.mask && input.value) {
    const maskOptions = {
      mask: props.mask
    } as Record<string, unknown>;

    maskedInstance.value = IMask(
      input.value,
      maskOptions
    ) as unknown as InputMask<string>;

    maskedInstance.value?.on("accept", () => {
      modelValue.value = maskedInstance.value?.value;
    });
  }
}
</script>
