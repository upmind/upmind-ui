<script lang="ts">
import { defineComponent } from "vue";
import { utils } from "@upmind/flow";
import { UpmFormGenerator } from "@upmind/ui";
import { vanillaRenderers } from "@jsonforms/vue-vanilla";

import {
  defaultStyles,
  mergeStyles,
  prelineRenderers,
} from "../components/prelineRenderers";

export default defineComponent({
  name: "FormGenerator",
  extends: UpmFormGenerator,
  setup(props) {
    // -------
    // Her we setup and Provide the preline specific Renderers

    const { ajv } = utils.useValidation();

    // mergeStyles combines all classes from both styles definitions into one
    const formStyles = mergeStyles(defaultStyles, props.styles);

    // -------
    return {
      // -------
      ajv,
      renderers: Object.freeze([...vanillaRenderers, ...prelineRenderers]),
      formStyles,
    };
  },
});
</script>
