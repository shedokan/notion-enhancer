/**
 * notion-enhancer
 * (c) 2024 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://notion-enhancer.github.io/) under the MIT license
 */

let __$wrapper;
const setupWrapper = () => {
    const notionHelp = ".notion-help-button",
      { html, addMutationListener } = globalThis.__enhancerApi,
      { removeMutationListener } = globalThis.__enhancerApi;
    return (__$wrapper ??= new Promise((res) => {
      const addToDom = () => {
        const $help = document.querySelector(notionHelp);
        if (!$help) return;
        const gap = 12,
          computedStyles = getComputedStyle($help),
          visible = computedStyles.getPropertyValue("display") !== "none",
          width = computedStyles.getPropertyValue("width"),
          right = computedStyles.getPropertyValue("right"),
          offset = visible ? parseInt(width) + parseInt(right) + gap : 26,
          $wrapper = html`<div
            class="notion-enhancer--floating-buttons z-50 gap-[${gap}px]
            flex absolute bottom-[calc(26px+env(safe-area-inset-bottom))]"
            style="right:${offset}px"
          ></div>`;
        removeMutationListener(addToDom);
        $help.after($wrapper);
        res($wrapper);
      };
      addMutationListener(notionHelp, addToDom);
      addToDom();
    }));
  },
  addFloatingButton = async ($btn) => {
    if (document.contains($btn)) return;
    (await setupWrapper()).prepend($btn);
  },
  removeFloatingButton = ($btn) => $btn.remove();

function FloatingButton({ icon, ...props }, ...children) {
  const { html, extendProps } = globalThis.__enhancerApi;
  extendProps(props, {
    tabindex: 0,
    class: `notion-enhancer--floating-button
    size-[36px] flex items-center justify-center rounded-full
    text-([20px] [color:var(--theme--fg-primary)]) select-none cursor-pointer
    bg-[color:var(--theme--bg-secondary)] hover:bg-[color:var(--theme--bg-hover)]
    shadow-[rgba(15,15,15,0.2)_0px_0px_0px_1px,rgba(15,15,15,0.2)_0px_2px_4px]`,
  });
  return html`<button ...${props}>${children}</button>`;
}

if (globalThis.document) setupWrapper();
Object.assign((globalThis.__enhancerApi ??= {}), {
  addFloatingButton,
  removeFloatingButton,
});

export { addFloatingButton, FloatingButton };
