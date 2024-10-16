<template>
  <UpwTextbox
    v-bind="{ ...control, ...appliedOptions }"
    :id="control.id + '-input'"
    :disabled="!control.enabled"
    :model-value="control.data?.number"
    @change="onChange"
    type="phone"
  >
    <template #prepend="{}">
      <UpwListbox
        class="self-center"
        :disabled="!control.enabled"
        :model-value="control.data?.country || defaultCountryCode"
        :items="countries"
        has-search
        @update:modelValue="onChangeCountry"
        grouped
        size="sm"
      />
    </template>
  </UpwTextbox>
</template>

<script lang="ts">
// --- external
import { computed, defineComponent, ref } from "vue";
import { schemaMatches, and, isObjectControl } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
// ---

import { countries } from "country-data";

// --- components
import UpwTextbox from "../../../textbox/Textbox.vue";
import UpwListbox from "../../../listbox/Listbox.vue";

// --- utils
import { useUpwindRenderer } from "../utils";
import { get, set, reduce } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";

export default defineComponent({
  name: "PhoneRenderer",
  components: {
    UpwTextbox,
    UpwListbox,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },

  setup(props: RendererProps<ControlElement>) {
    const renderer = useUpwindRenderer(
      useJsonFormsControl(props),
      target => target?.value
    );

    const defaultCountryCode = get(
      renderer,
      "control.value.schema.isPhoneNumber"
    );

    const phone = ref({ ...renderer.control.value.data });

    function onChangeCountry(value: string) {
      set(phone.value, "country", value);
      // forward the event to the input control that will trigger the update
      // NB: this is not a DOM event so we need to fake one for the renderer
      renderer.onChange({
        currentTarget: { value: phone.value },
      });
    }

    function onChange(target: Event) {
      set(phone.value, "number", target.currentTarget.value);
      // forward the event to the input control that will trigger the update
      // NB: this is not a DOM event so we need to fake one for the renderer
      renderer.onChange({
        currentTarget: { value: phone.value },
      });
    }

    // ------------------------------------------------

    return {
      ...renderer,
      onChangeCountry,
      onChange,
      countries: computed(() => {
        const raw = renderer.appliedOptions.value?.countries || countries.all;
        const parsed = reduce(
          raw,
          (result, value) => {
            const country = {
              prependAvatar: {
                path: "flags",
                name: (value?.alpha2 || value).toLowerCase(),
              },
              label: value?.alpha2 || value,
              value: value?.alpha2 || value,
            };
            result.push(country);
            return result;
          },
          []
        );
        return parsed;
      }),
      defaultCountryCode,
    };
  },
});

export const tester = {
  rank: 2,
  controlType: and(
    isObjectControl,
    schemaMatches(schema => !!schema?.isPhoneNumber)
  ),
};
</script>
