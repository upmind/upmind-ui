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

    <ModelRenderer
      v-if="openModel"
      :id="editId"
      :label="formFieldProps.label"
      :composable="get(control.uischema, 'options.modify')"
      @resolve="openModel = false"
    />
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
import ModelRenderer from "./ModelRenderer.vue";

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
const { control, formFieldProps, onInput } =
  useUpmindUIRenderer(jsonFormsControl);

const open = ref(false);
const openModel = ref(false);
const editId = ref<string>("");
const selectedItem = ref<string>("");

const { data, default: defaultItem } = get(
  control.value.uischema,
  "options.use"
)();

onMounted(() => {
  selectedDefaultItem();
});

const selectOnly = computed(() => {
  return control.value.uischema.options?.selectOnly || false;
});

const parsedValues = computed(() => {
  return map(data.value || [], (item: any, index: number) => {
    return {
      id: item.id,
      value: item.id,
      label: item.title,
      item: item,
      index: index,
      modelValue: selectedItem.value,
    };
  }) as RadioCardsItemProps[];
});

const selectItem = async (value: string) => {
  onInput(value, false);
  selectedItem.value = value;
};

const addNewItem = () => {
  openModel.value = true;
};

const editItem = (id: string) => {
  editId.value = id;
  openModel.value = true;
};

watch(parsedValues, () => {
  selectedDefaultItem();
});

const selectedDefaultItem = () => {
  selectedItem.value = control.value.data;
  if (!selectedItem.value) {
    // We don't have a default from the schema, let the composable set the default
    selectedItem.value = defaultItem.value?.id;
    onInput(selectedItem.value, false);
  }
};
</script>
