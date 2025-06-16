<template>
  <FormField v-bind="formFieldProps" required label="">
    <RadioCardsCollapsible
      v-model:open="open"
      v-model="selectedItem"
      :items="parsedValues"
      @update:model-value="selectItem"
      list
      required
    >
      <template #item="{ item, isSelected }">
        <Item
          v-bind="item"
          :is-selected="isSelected && !selectOnly"
          :allow-edit="!selectOnly"
          @edit="editItem"
        />
      </template>

      <template #actions>
        <Link
          v-if="!open && parsedValues.length > 1"
          label="Change"
          size="xs"
          variant="muted"
          @click="open = true"
        />

        <Link
          v-else-if="!selectOnly"
          :label="'Add new ' + lowerCase(formFieldProps.label)"
          size="xs"
          variant="muted"
          @click="addNewItem"
        />
      </template>
    </RadioCardsCollapsible>
  </FormField>
</template>

<script lang="ts" setup>
// --- external
import { ref, computed, watch, onMounted } from "vue";
import { useJsonFormsControl } from "@jsonforms/vue";

// --- components
import {
  FormField,
  RadioCardsCollapsible,
  Link,
} from "@upmind-automation/upmind-ui";
import Item from "./ModelListRendererItem.vue";

// --- utils
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";
import { find, lowerCase, map, get, flatMap, has } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";
import type { RadioCardsItemProps } from "@upmind-automation/upmind-ui";

// ----------------------------------------------

const props = defineProps<RendererProps<ControlElement>>();

const jsonFormsControl = useJsonFormsControl(props);
const { control, formFieldProps, onInput, handleChange } =
  useUpmindUIRenderer(jsonFormsControl);

const open = ref(false);
const selectedItem = ref<string>("");

const { schema, uischema, update, inputs } = get(
  control.appliedOptions.value,
  "use"
);

onMounted(() => {
  selectedDefaultItem();
});

const selectOnly = computed(() => {
  return control.value.uischema.options?.selectOnly || false;
});

const getSchemaProperty = (path?: string) => {
  if (!path) return null;

  const nestedPath = flatMap(path.split("."), (part, index) =>
    index === 0 ? ["definitions", part] : ["properties", part]
  );

  return (
    get(control.value.rootSchema, nestedPath) ||
    get(control.value.rootSchema, ["properties", path])
  );
};

const parsedValues = computed(() => {
  return map(
    control.value.uischema.options?.oneOf || [],
    (item: any, index: number) => {
      return {
        id: item.id,
        value: item.id,
        label: item.title,
        item: item.item,
        index: index,
        modelValue: selectedItem.value,
      };
    }
  ) as RadioCardsItemProps[];
});

const selectItem = async (value: string) => {
  debugger;
  onInput(value, false);
  debugger;
  selectedItem.value = value;
};

const addNewItem = () => {
  const schemaProperty = getSchemaProperty(control.value.path);
  const create = get(schemaProperty, "create");

  if (create) {
    handleChange(create, true);
  } else {
    onInput(null, false);
  }
};

const editItem = (id: string) => {
  const schemaProperty = getSchemaProperty(control.value.path);
  const update = get(schemaProperty, "update");

  handleChange(update, id);
};

watch(parsedValues, () => {
  selectedDefaultItem();
});

const selectedDefaultItem = () => {
  if (control.value.data) {
    const matchingItem = find(
      parsedValues.value,
      item => item.id === control.value.data
    );
    if (matchingItem?.id) {
      if (matchingItem.id !== selectedItem.value) {
        open.value = false;
        selectedItem.value = matchingItem.id;
      }
      return;
    }
  }

  const defaultItem =
    (
      find(
        parsedValues.value,
        value => value.item?.meta?.isDefault
      ) as RadioCardsItemProps
    )?.id ?? "";

  if (defaultItem && defaultItem !== selectedItem.value) {
    open.value = false;
    selectedItem.value = defaultItem;
  }
};
</script>

<script lang="ts">
import { uiTypeIs, and, schemaMatches } from "@jsonforms/core";

export const tester = {
  rank: 4,
  controlType: and(uiTypeIs("ModelList")),
};
</script>
