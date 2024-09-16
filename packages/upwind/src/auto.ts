// --- styles
import "./assets/upwind.css";

import { UwAlert } from "./ui/alert";
import { UwAvatar } from "./ui/avatar";
import { UwBadge } from "./ui/badge";
import { UwButton } from "./ui/button";
import { UwCombobox } from "./ui/combobox";
import { UwDialog } from "./ui/dialog";
import { UwDrawer } from "./ui/drawer";
import { UwIcon } from "./ui/icon";
import { UwIndicator } from "./ui/indicator";
import { UwSonner } from "./ui/sonner";
import { UwTabs } from "./ui/tabs";
import { UwTooltip } from "./ui/tooltip";

// -----------------------------------------------------------------------------

// --- Auto register all custom elements
customElements.define("uw-alert", UwAlert);
customElements.define("uw-avatar", UwAvatar);
customElements.define("uw-badge", UwBadge);
customElements.define("uw-button", UwButton);
customElements.define("uw-combobox", UwCombobox);
customElements.define("uw-dialog", UwDialog);
customElements.define("uw-drawer", UwDrawer);
customElements.define("upw-icon", UwIcon);
customElements.define("uw-indicator", UwIndicator);
customElements.define("uw-sonner", UwSonner);
customElements.define("uw-tabs", UwTabs);
customElements.define("uw-tooltip", UwTooltip);
