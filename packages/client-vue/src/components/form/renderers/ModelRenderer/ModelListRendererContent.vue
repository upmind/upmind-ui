<template>
  <FormField
    v-bind="formFieldProps"
    required
    :label="!isEmpty(parsedValues) ? formFieldProps.label : ''"
  >
    <RadioCardsCollapsible
      v-if="!meta.isLoading && !isEmpty(parsedValues)"
      v-model:open="open"
      v-model="selectedItem"
      :items="parsedValues"
      @update:model-value="selectItem"
      :list="false"
      :minimal="type === 'Phone'"
      required
    >
      <template #item="{ item }">
        <ModelListRendererPhoneItem
          v-if="type === 'Phone'"
          v-bind="item.phone"
        />
        <Item
          v-else
          v-bind="item"
          :is-default="item?.meta?.isDefault || false"
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
          :label="'Add new ' + lowerCase(type)"
          size="xs"
          variant="muted"
          @click="addNewItem"
        />
      </template>
    </RadioCardsCollapsible>

    <ModelRenderer
      v-if="
        (!meta.isLoading && isEmpty(parsedValues) && hasMutateComposable) ||
        openModel
      "
      v-model:open="openModel"
      :is="isEmpty(parsedValues) ? 'section' : 'Dialog'"
      :id="editId"
      :label="formFieldProps.label"
      :composable="get(control.uischema, 'options.mutate')"
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
import ModelListRendererPhoneItem from "./ModelListRendererPhoneItem.vue";

// --- utils
import { useUpmindUIRenderer } from "@upmind-automation/upmind-ui";
import { lowerCase, map, get, isEmpty, isFunction } from "lodash-es";

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

const {
  data,
  default: defaultItem,
  meta,
} = get(control.value.uischema, "options.list")();

const type = computed(() => {
  return get(control.value.uischema, "options.type");
});

const hasMutateComposable = computed(() => {
  return isFunction(get(control.value.uischema, "options.mutate"));
});

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
