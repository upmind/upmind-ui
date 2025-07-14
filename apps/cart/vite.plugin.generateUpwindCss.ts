import type { Plugin } from "vite";

/**
 * Vite plugin to generate an upmind CSS file that imports the index CSS file.
 * @returns {Plugin} The Vite plugin object.
 */
function GenerateUpmindCssPlugin(): Plugin {
  return {
    name: "vite-plugin-upmind-css",
    apply: "build",

    async generateBundle(_, bundle) {
      // Find the hashed CSS file name in the output bundle
      let cssFileName;

      for (const fileName in bundle) {
        if (fileName.endsWith(".css") && fileName.includes("index")) {
          cssFileName = fileName;
          break;
        }
      }

      if (cssFileName) {
        const upmindCssContent = `@import url("${cssFileName}");`;

        // Write the `upmind-ui.css` file to the output directory
        this.emitFile({
          type: "asset",
          fileName: "upmind-ui.css", // Static file name
          source: upmindCssContent // Content with the dynamic @import
        });

        // console.debug(
        //   `upmind-ui.css has been created with @import url("${cssFileName}");`
        // );
      } else {
        console.warn('No CSS file found with "index" in its name.');
      }
    }
  };
}

// Export the plugin
export default GenerateUpmindCssPlugin;
