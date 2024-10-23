// --- external
import type { HTMLAttributes } from "vue";

export interface AutocompleteItemProps {
  label: string;
}

export interface ComboboxProps {
  // --- state
  items: AutocompleteItemProps[];
  modelValue?: string;
  defaultValue?: string;
  // searchValue?: string;
  placeholder?: string;
  emptyMessage?: string;
  // --- styles
  upwindConfig?: { combobox: Partial<ComboboxProps> };
  class?: HTMLAttributes["class"];
}
