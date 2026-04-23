<template>
  <Input
    v-bind="delegatedProps"
    :type="unmask ? 'text' : 'password'"
    :autocomplete="props.autocomplete || 'current-password'"
    :class="props.class"
    v-model="modelValue"
  >
    <template #append>
      <Tooltip v-if="props.generator" :label="props.generateLabel" side="top">
        <Link
          :class="styles.inputPassword.action"
          :focusable="false"
          :disabled="props.disabled || props.readonly"
          @click.prevent="onGenerate"
        >
          <Icon icon="magic-wand-02" size="2xs" />
        </Link>
      </Tooltip>

      <Tooltip :label="unmask ? props.hideLabel : props.showLabel" side="top">
        <Link
          :class="styles.inputPassword.toggle"
          :focusable="false"
          @click.prevent="unmask = !unmask"
        >
          <Icon v-if="unmask" icon="eye-off" size="2xs" />
          <Icon v-else icon="eye" size="2xs" />
        </Link>
      </Tooltip>
    </template>
  </Input>
</template>

<script lang="ts" setup>
// --- external
import { useVModel } from "@vueuse/core";
import { computed, ref } from "vue";
// --- components
import Input from "../input/Input.ce.vue";
import { Icon } from "../icon";
import { Link } from "../link";
import Tooltip from "../tooltip/Tooltip.ce.vue";
// --- internal
import config from "./input-password.config";
// --- utils
import { useStyles } from "../../utils";
import { omit } from "lodash-es";
// --- types
import type { InputPasswordProps } from "./types";
// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<InputPasswordProps>(), {
  generator: false,
  generateLabel: "Generate a strong password",
  showLabel: "Show password",
  hideLabel: "Hide password",
  // --- styles
  uiConfig: () => ({ inputPassword: [] }),
  class: ""
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "generate"): void;
}>();

const modelValue = useVModel(props, "modelValue", emit, {
  passive: true,
  defaultValue: props.defaultValue ?? ""
});

const unmask = ref(false);

const delegatedProps = computed(() =>
  omit(props, [
    "class",
    "uiConfig",
    "defaultValue",
    "modelValue",
    "autocomplete",
    "generator",
    "generateLabel",
    "showLabel",
    "hideLabel"
  ])
);

function onGenerate() {
  // Unmask so the user can see the generated value; parent sets modelValue.
  unmask.value = true;
  emit("generate");
}

const meta = computed(() => ({
  active: unmask.value
}));
const styles = useStyles(["inputPassword"], meta, config, props.uiConfig ?? {});
</script>
