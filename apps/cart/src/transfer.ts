import { useTransfer } from "@upmind-automation/headless";
import Upmind from "./shell/useUpmindClient";

// -----------------------------------------------------------------------------

Upmind.init({
  mode: "express",
  pop: {
    name: import.meta.env.VITE_API_NAME,
    apiUrl: import.meta.env.VITE_API_URL,
    region: import.meta.env.VITE_API_REGION
  }
}).then(async () => await useTransfer().transferFrom());
