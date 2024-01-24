/**
 * notion-enhancer: titlebar
 * (c) 2024 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://notion-enhancer.github.io/) under the MIT license
 */

"use strict";

import { Tooltip } from "../../core/islands/Tooltip.mjs";
import { TopbarButton } from "../../core/islands/TopbarButton.mjs";

const minimizeLabel = "Minimize window",
  maximizeLabel = "Maximize window",
  unmaximizeLabel = "Unmaximize window",
  closeLabel = "Close window";

const createWindowButtons = () => {
  const { html } = globalThis.__enhancerApi,
    $minimize = html`<${TopbarButton}
      aria-label="${minimizeLabel}"
      icon="minus"
    />`,
    $maximize = html`<${TopbarButton}
      aria-label="${maximizeLabel}"
      icon="maximize"
    />`,
    $unmaximize = html`<${TopbarButton}
      aria-label="${unmaximizeLabel}"
      icon="minimize"
    />`,
    $close = html`<${TopbarButton}
      class="!hover:(bg-red-600 text-white)"
      aria-label="${closeLabel}"
      icon="x"
    />`;
  html`<${Tooltip}><b>${minimizeLabel}</b><//>`.attach($minimize, "bottom");
  html`<${Tooltip}><b>${maximizeLabel}</b><//>`.attach($maximize, "bottom");
  html`<${Tooltip}><b>${unmaximizeLabel}</b><//>`.attach($unmaximize, "bottom");
  html`<${Tooltip}><b>${closeLabel}</b><//>`.attach($close, "bottom");
  return html`<div>${$minimize}${$maximize}${$unmaximize}${$close}</div>`;
};

if (globalThis.IS_TABS) {
  const appendAfter = ".hide-scrollbar",
    $buttons = createWindowButtons();
  document.querySelector(appendAfter)?.after($buttons);
}

export { createWindowButtons };