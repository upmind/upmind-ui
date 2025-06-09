import { computed, ref } from "vue";
import { merge, cloneDeep } from "lodash-es";
import type { ComputedRef } from "vue";

export const useDaisyControl = <
  I extends { control: any; handleChange: Function },
>(
  input: I,
  adaptTarget: (target: any) => any = v => v?.value || v || null
) => {
  const isFocused = ref(false);

  const appliedOptions: ComputedRef<any> = computed(() => {
    return merge(
      {},
      cloneDeep(input.control.value.config),
      cloneDeep(input.control.value.uischema.options)
    );
  });

  const onChange = (value: any) => {
    input.handleChange(input.control.value.path, adaptTarget(value));
  };

  const controlWrapper = computed(() => ({
    id: input.control.value.id,
    label: input.control.value.label,
    description: input.control.value.description,
    required: input.control.value.required,
    disabled: !input.control.value.enabled,
    visible: input.control.value.visible,
    errors: input.control.value.errors,
  }));

  // Basic styles for Daisy UI classes
  const styles = computed(() => ({
    control: {
      file: "file-input file-input-bordered w-full",
      error: {
        input: "file-input-error",
      },
    },
  }));

  return {
    control: input.control,
    controlWrapper,
    handleChange: input.handleChange,
    appliedOptions,
    onChange,
    isFocused,
    styles,
  };
};
