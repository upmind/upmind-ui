// --- styles
import "./assets/upmind-ui.css";

import { UpmAlert } from "./ui/alert";
import { UpmAvatar } from "./ui/avatar";
import { UpmBadge } from "./ui/badge";
import { UpmButton } from "./ui/button";
import { UpmCombobox } from "./ui/combobox";
import { UpmDialog } from "./ui/dialog";
import { UpmDrawer } from "./ui/drawer";
import { UpmIcon } from "./ui/icon";
import { UpmIndicator } from "./ui/indicator";
import { UpmSonner } from "./ui/sonner";
import { UpmTabs } from "./ui/tabs";
import { UpmTooltip } from "./ui/tooltip";

// -----------------------------------------------------------------------------

// --- Auto register all custom elements
customElements.define("uw-alert", UpmAlert);
customElements.define("uw-avatar", UpmAvatar);
customElements.define("uw-badge", UpmBadge);
customElements.define("uw-button", UpmButton);
customElements.define("uw-combobox", UpmCombobox);
customElements.define("uw-dialog", UpmDialog);
customElements.define("uw-drawer", UpmDrawer);
customElements.define("upw-icon", UpmIcon);
customElements.define("uw-indicator", UpmIndicator);
customElements.define("uw-sonner", UpmSonner);
customElements.define("uw-tabs", UpmTabs);
customElements.define("uw-tooltip", UpmTooltip);
