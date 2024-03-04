<script lang="ts">
import { defineComponent } from "vue";
import { utils } from "@upmind/flow";
import { UpmFormGenerator } from "@upmind/ui";
import { defaultStyles, mergeStyles, daisyRenderers } from "./daisyRenderers";

export default defineComponent({
  name: "FormGenerator",
  extends: UpmFormGenerator,
  setup(props) {
    // -------
    // Her we setup and Provide the Daisy specific Renderers

    const { ajv } = utils.useValidation();

    // mergeStyles combines all classes from both styles definitions into one
    const formStyles = mergeStyles(defaultStyles, props.styles);

    // -------
    return {
      // -------
      ajv,
      renderers: Object.freeze([...daisyRenderers]),
      formStyles
    };
  }
});
</script>
