import { defineComponent } from "vue";
import { stubTrue } from "lodash-es";
import type { MissingControlRendererProps } from "./types";

/** Outranked by every registered control, so it mounts only where none matched. */
export const missingControlTester = { rank: 0, controlType: stubTrue };

export const MissingControlRenderer = defineComponent(
  (props: MissingControlRendererProps) => {
    console.warn(
      `[Form] No registered control renders "${props.uischema.type}" — import the package that registers it at startup.`,
      props.uischema
    );
    return () => null;
  },
  { name: "MissingControlRenderer", props: ["uischema"], inheritAttrs: false }
);
