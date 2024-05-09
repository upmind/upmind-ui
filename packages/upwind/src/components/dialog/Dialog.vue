<template>
  <h-transition-root appear :show="meta.isActive" as="template">
    <h-dialog as="aside" @close="doClose" :class="styles.dialog.root">
      <!-- skrim -->
      <h-transition-child
        as="template"
        :enter="styles.skrimTransitionEnter.active"
        :enter-from="styles.skrimTransitionEnter.from"
        :enter-to="styles.skrimTransitionEnter.to"
        :leave="styles.skrimTransitionLeave.active"
        :leave-from="styles.skrimTransitionLeave.from"
        :leave-to="styles.skrimTransitionLeave.to"
      >
        <div :class="styles.dialog.skrim" />
      </h-transition-child>

      <!-- content -->
      <div :class="styles.dialog.wrapper">
        <div :class="styles.dialog.content">
          <h-transition-child
            as="template"
            :enter="styles.dialogTransitionEnter.active"
            :enter-from="styles.dialogTransitionEnter.from"
            :enter-to="styles.dialogTransitionEnter.to"
            :leave="styles.dialogTransitionLeave.active"
            :leave-from="styles.dialogTransitionLeave.from"
            :leave-to="styles.dialogTransitionLeave.to"
          >
            <h-dialog-panel :class="styles.dialog.panel">
              <div :class="styles.dialog.panelContent">
                <h-dialog-title
                  v-if="title"
                  as="h4"
                  :class="styles.dialog.title"
                >
                  <slot name="title">{{ title }}</slot>
                </h-dialog-title>

                <slot>
                  <p :class="styles.dialog.text" v-if="text">
                    {{ text }}
                  </p>

                  <p :class="styles.dialog.data" v-if="data">
                    {{ data }}
                  </p>
                </slot>
              </div>
              <upw-button
                type="button"
                variant="ghost"
                label="Close the dialog"
                prependIcon="close-circle"
                color="current"
                icon-only
                size="sm"
                @click="doClose"
                :class="styles.dialog.close"
              />
            </h-dialog-panel>
          </h-transition-child>
        </div>
      </div>
    </h-dialog>
  </h-transition-root>
</template>

<script lang="ts">
// --- external
import { computed, defineComponent, toRef } from "vue";

// --- internal
import config from "./config.cva";

// --- components
import UpwButton from "../button/Button.vue";
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/vue";

// --- utils
import { isNil } from "lodash-es";
import { useStyles } from "../../utils";

// --- types
import type { DialogProps } from "./types";
// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpwDialog",
  components: {
    UpwButton,
    HTransitionRoot: TransitionRoot,
    HTransitionChild: TransitionChild,
    HDialog: Dialog,
    HDialogPanel: DialogPanel,
    HDialogTitle: DialogTitle,
  },
  emits: ["update:modelValue"],
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    // ---
    title: {
      type: String,
    },
    text: {
      type: String,
    },
    data: {
      type: String,
    },
    skrim: {
      type: String as PropType<DialogProps["skrim"]>,
      default: "normal",
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  setup(props, { emit }) {
    const open = toRef(props, "modelValue");

    const meta = computed(() => ({
      skrim: props.skrim,
      // ---
      isActive: open.value,
    }));

    const styles = useStyles(
      [
        "dialog",
        "dialogTransitionEnter",
        "dialogTransitionLeave",
        "skrimTransitionEnter",
        "skrimTransitionLeave",
      ],
      meta,
      config,
      props.upwindConfig
    );

    function toggleModal(value) {
      open.value = isNil(value) ? !open.value : value;
      emit("update:modelValue", value);
    }

    return {
      meta,
      styles,
      doClose: () => toggleModal(false),
    };
  },
});
</script>
