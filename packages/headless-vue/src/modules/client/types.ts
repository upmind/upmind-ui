import type { ComputedRef } from "vue";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { ActorRef } from "xstate";
// -----------------------------------------------------------------------------

export type ClientListingDefinition = {
  state: ComputedRef<any>;
  context: ComputedRef<any>;
  errors: ComputedRef<any>;
  meta: ComputedRef<{
    isAvailable: boolean;
    isLoading: boolean;
    isProcessing: boolean;
    hasErrors: boolean;
    isAdding: boolean;
    isEditing: boolean;
    isEmpty: boolean;
    canFilter: boolean;
  }>;
  items: ComputedRef<ActorRef<any>[]>;
  selected: ComputedRef<any>;
  initial: ComputedRef<string | undefined>;
  isReady: () => Promise<any>;
  getSelected: () => Promise<any>;
  filter: (data: any) => any;
  select: (id: any) => Promise<void>;
  edit: (id: any) => Promise<void>;
  add: () => Promise<void>;
};

export type ClientItemDefinition = {
  state: ComputedRef<any>;
  context: ComputedRef<any>;
  errors: ComputedRef<any>; //messages: computed(() => state.value.context?.messages),
  // ---
  meta: ComputedRef<{
    isDisabled: boolean;
    isSelected: boolean;
    isHidden: boolean;
    isSelectable: boolean;
    // ---
    isLoading: boolean;
    hasErrors: boolean;
    isProcessing: boolean;
    isValid: boolean;
    isNew: boolean;
    canRemove: boolean;
    isDefault: boolean;
    isVerified: boolean;
    isComplete: boolean;
    type?: string;
  }>;
  // ---
  filters: ComputedRef<any>; // computed(() => state.value.context?.filters),
  title: ComputedRef<string>;
  description: ComputedRef<string>;
  // ---
  model: ComputedRef<object>;
  schema: ComputedRef<JsonSchema>;
  uischema: ComputedRef<UISchemaElement>;
  // ---
  clear: () => void;
  input: (model: any) => void;
  update: () => void;
  remove: () => void;
  setDefault: () => void;
  // ---
  select: () => void;
  edit: () => void;
  cancel: () => void;
};

export type ClientComposables = {
  useClientListing: () => ClientListingDefinition;
  useClientItem: (
    item: any, // Actor
    context?: Record<string, any>
  ) => ClientItemDefinition;
};
