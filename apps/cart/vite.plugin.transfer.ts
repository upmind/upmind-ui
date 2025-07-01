import type { Plugin } from "vite";

/**
 * Vite plugin to rewrite /auth/transfer (with or without query params) to /transfer.html for clean URLs.
 * @returns {Plugin} The Vite plugin object.
 */
function UpmindTransferPlugin(): Plugin {
  return {
    name: "vite-plugin-upmind-transfer",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Match /auth/transfer or /auth/transfer/ with optional query params
        if (req.url && req.url.match(/^\/auth\/transfer\/?(\?.*)?$/)) {
          req.url =
            "/transfer.html" +
            (req.url.includes("?")
              ? req.url.substring(req.url.indexOf("?"))
              : "");
        }
        next();
      });
    },
  };
}

export default UpmindTransferPlugin;
