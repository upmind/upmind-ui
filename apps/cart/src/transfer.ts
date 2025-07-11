// --- external
import Upmind, { useTransfer } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

Upmind.init({
  mode: "express",
  pop: {
    name: import.meta.env.VITE_API_NAME,
    apiUrl: import.meta.env.VITE_API_URL,
    region: import.meta.env.VITE_API_REGION
  }
}).then(async () => await useTransfer().transferFrom());
