import { computed, shallowRef } from "vue";
import { addRenderers, clearRenderers } from "../renderers";
import { addRoutes, clearRouting, registerFlows } from "../routing";
import type { FeatureContext, FeatureDefinition } from "./feature.types";

// The singleton registry. Feature contributions are brand-invariant, so one
// process-global set is safe under SSR (ADR 023 §10 Axis 1).
const features = shallowRef<FeatureDefinition[]>([]);
const setUp = new Set<string>();

const context: FeatureContext = { addRenderers, addRoutes, registerFlows };

export const useFeatures = () => {
  const names = computed(() => features.value.map(feature => feature.name));

  const register = (...added: FeatureDefinition[]) => {
    const fresh = added.filter(feature => !names.value.includes(feature.name));

    features.value = features.value.concat(fresh);
  };

  /** Runs each registered feature's `setup` once, in registration order. */
  const install = () => {
    for (const feature of features.value) {
      if (setUp.has(feature.name)) continue;

      setUp.add(feature.name);
      feature.setup(context);
    }
  };

  /** Drops every registration and empties the sockets `install` filled. */
  const reset = () => {
    features.value = [];
    setUp.clear();
    clearRenderers();
    clearRouting();
  };

  return {
    features: computed(() => features.value),
    names,
    has: (name: string) => names.value.includes(name),
    register,
    install,
    reset
  };
};

export type UseFeatures = ReturnType<typeof useFeatures>;
