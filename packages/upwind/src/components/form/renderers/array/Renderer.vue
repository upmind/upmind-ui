<template>
  <fieldset v-if="control.visible" :class="styles.arrayList.root">
    <legend :class="styles.arrayList.legend">
      <button
        :class="styles.arrayList.addButton"
        type="button"
        @click="addButtonClick"
      >
        +
      </button>
      <label :class="styles.arrayList.label">
        {{ control.label }}
      </label>
    </legend>
    <div
      v-for="(element, index) in control.data"
      :key="`${control.path}-${index}`"
      :class="styles.arrayList.itemWrapper"
    >
      <array-list-element
        :move-up="moveUp(control.path, index)"
        :move-up-enabled="index > 0"
        :move-down="moveDown(control.path, index)"
        :move-down-enabled="index < control.data.length - 1"
        :delete="removeItems(control.path, [index])"
        :label="childLabelForIndex(index)"
        :styles="styles"
      >
        <dispatch-renderer
          :schema="control.schema"
          :uischema="childUiSchema"
          :path="composePaths(control.path, `${index}`)"
          :enabled="control.enabled"
          :renderers="control.renderers"
          :cells="control.cells"
        />
      </array-list-element>
    </div>
    <div v-if="meta.isEmpty" :class="styles.arrayList.empty">
      {{ control.translations.emptyMessage }}
    </div>
  </fieldset>
</template>

<script lang="ts">
// --- global
import { computed, defineComponent } from "vue";
import {
  composePaths,
  createDefaultValue,
  schemaTypeIs,
} from "@jsonforms/core";

import {
  DispatchRenderer,
  rendererProps,
  useJsonFormsArrayControl,
} from "@jsonforms/vue";

// --- components
import ArrayListElement from "./components/ArrayListElement.vue";
import ControlWrapper from "../wrapper/RendererInline.vue";
import UpwCheckbox from "../../../../checkbox/Checkbox.vue";
// import UpwCheckbox from "../../../../radio/Radio.vue";

// --- local
import config from "./config.cva";

// --- utils
import { useUpwindArrayRenderer } from "../utils";
import { isEmpty, isNil } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { InputProps } from "../controls/types";

export default defineComponent({
  name: "ArrayRenderer",
  components: {
    ArrayListElement,
    DispatchRenderer,
  },
  props: {
    ...rendererProps<ControlElement>(),
    size: {
      type: String as PropType<InputProps["size"]>,
      default: null,
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },
  setup(props: RendererProps<ControlElement>) {
    const meta = computed(() => ({
      isEmpty: isEmpty(renderer.control.data),
      isInvalid: !isEmpty(renderer.control.value.errors),
      isDirty: !isNil(renderer.control.value.data),
      isFocused: renderer.isFocused.value,
      isRequired: renderer.control.value.required,
      isVisible: renderer.control.value.visible,
      isDisabled: !renderer.control.value.enabled,
    }));

    const renderer = useUpwindArrayRenderer(useJsonFormsArrayControl(props));

    // we dont process styles as  we are using an upwind control, so rather pass the configs and allow the control to handle it
    return {
      ...renderer,
      meta,
      config,
    };
  },

  methods: {
    composePaths,
    createDefaultValue,
    addButtonClick() {
      this.addItem(
        this.control.path,
        createDefaultValue(this.control.schema)
      )();
    },
  },
});

export const tester = {
  rank: 2,
  controlType: schemaTypeIs("array"),
};
</script>
