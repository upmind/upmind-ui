<template>
  <h-transition-root appear :show="meta.isActive" as="template">
    <h-dialog as="aside" @close="doReject" :class="styles.dialog.root">
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
            <h-dialog-panel :class="styles.dialog.panelWrapper">
              <aside :class="styles.dialog.panel">
                <header :class="styles.dialog.panelHeader">
                  <h-dialog-title
                    v-if="title"
                    as="h4"
                    :class="styles.dialog.title"
                  >
                    <slot name="title">{{ title }}</slot>
                  </h-dialog-title>
                  <upw-button
                    type="button"
                    variant="link"
                    label="Close the dialog"
                    prependIcon="close"
                    color="current"
                    icon-only
                    size="sm"
                    @click="doReject"
                    :class="styles.dialog.close"
                  />
                </header>

                <div :class="styles.dialog.panelContent">
                  <slot>
                    <p :class="styles.dialog.text" v-if="text">
                      {{ text }}
                    </p>

                    <p :class="styles.dialog.data" v-if="data">
                      {{ data }}
                    </p>
                  </slot>
                </div>

                <footer
                  :class="styles.dialog.panelActions"
                  v-if="$slots.actions || safeActions"
                >
                  <slot name="actions" v-bind="{ meta, doReject, doResolve }">
                    <upw-button
                      v-for="(action, key) in safeActions"
                      :key="key"
                      v-bind="action"
                      :loading="action.loading"
                      :disabled="action?.disabled"
                      @click="doAction(action, $event)"
                    />
                  </slot>
                </footer>
              </aside>
            </h-dialog-panel>
          </h-transition-child>
        </div>
      </div>
    </h-dialog>
  </h-transition-root>
</template>

<script lang="ts">
// --- external
import { computed, defineComponent, ref, watch } from "vue";

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
import { isFunction, isNil, includes } from "lodash-es";

import { useStyles } from "../../utils";

// --- types
import type { PropType } from "vue";
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
  emits: ["update:modelValue", "reject", "resolve", "click"],
  props: {
    modelValue: {
      type: Boolean,
      default: true,
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
    actions: {
      type: [Boolean, Object] as PropType<
        Boolean | Record<string, { label: string; action: Function }>
      >,
      default: null,
    },
    // ---
    size: {
      type: String as PropType<DialogProps["size"]>,
      default: "md",
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
    // --- model
    const open = ref(props.modelValue);
    watch(
      () => props.modelValue,
      value => {
        open.value = value;
      }
    );
    // ---

    const meta = computed(() => ({
      size: props.size,
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
      toggleModal,
    };
  },
  computed: {
    safeActions() {
      return this.actions;
      // if (isNil(this.actions)) {
      //   return {
      //     reject: {
      //       label: "Cancel",
      //       variant: "link",
      //       action: () => {
      //         this.doReject();
      //       },
      //     },
      //   };
      // } else if (this.actions) {
      //   return this.actions;
      // }
      // return null;
    },
  },
  methods: {
    doAction(item, $event) {
      if (!includes(["submit", "reset"], item?.type)) {
        // dont propagate the form if we are have an action that is not submit or reset
        $event.preventDefault();
      }

      if (isFunction(item.action)) {
        item.action(this.modelValue);
        return;
      }

      if (item.type == "submit") {
        this.doResolve();
        return;
      }

      if (item.type == "reset") {
        this.doReject();
        return;
      }

      this.$emit("click", this.modelValue);
    },

    doResolve() {
      this.$emit("resolve");
      this.toggleModal(false);
    },

    doReject() {
      this.$emit("reject");
      this.toggleModal(false);
    },
  },
});
</script>
