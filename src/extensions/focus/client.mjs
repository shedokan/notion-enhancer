/**
 * notion-enhancer: focus
 * (c) 2020 Arecsu
 * (c) 2024 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://notion-enhancer.github.io/) under the MIT license
 */

export default async (api, db) => {
  // tabs can only be hidden in the desktop app
  const { platform, sendMessage, addMutationListener } = api;
  if (!["linux", "win32", "darwin"].includes(platform)) return;

  let _state;
  const sidebar = ".notion-sidebar-container",
    onUpdate = () => {
      const $sidebar = document.querySelector(sidebar),
        state = $sidebar.hasAttribute("aria-hidden") ? "collapsed" : "pinned";
      if (state === _state) return;
      sendMessage("notion-enhancer:focus", "sidebar-" + (_state = state));
    };
  addMutationListener(sidebar, onUpdate, { childList: false, subtree: false });
  onUpdate();
};
