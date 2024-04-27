/**
 * notion-enhancer: focus
 * (c) 2020 Arecsu
 * (c) 2021 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://notion-enhancer.github.io/) under the MIT license
 */

"use strict";

module.exports = async (api, db) => {
  const { onMessage } = api,
    focusClass = "sidebar-collapsed";
  onMessage("notion-enhancer:focus", (message) => {
    const $root = document.querySelector("#root");
    if (message === "sidebar-pinned") $root?.classList.remove(focusClass);
    if (message === "sidebar-collapsed") $root?.classList.add(focusClass);
  });
};
