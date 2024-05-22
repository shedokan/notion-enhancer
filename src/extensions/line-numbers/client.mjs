/**
 * notion-enhancer: line numbers
 * (c) 2020 CloudHill <rl.cloudhill@gmail.com> (https://github.com/CloudHill)
 * (c) 2024 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://notion-enhancer.github.io/) under the MIT license
 */

function LineNumber({ number, height, ...props }) {
  const { html } = globalThis.__enhancerApi;
  return html`<span class="block text-right" style="height:${height}px">
    ${number}
  </span>`;
}

export default async (api, db) => {
  const { html, addMutationListener } = api,
    numberSingleLines = await db.get("numberSingleLines"),
    lineNumberDecoration = await db.get("lineNumberDecoration"),
    lineNumbersClass = "notion-enhancer--line-numbers",
    codeBlockSelector = ".notion-code-block.line-numbers";

  const numberLines = () => {
    for (const $block of document.querySelectorAll(codeBlockSelector)) {
      const $code = $block.lastElementChild,
        computedStyles = getComputedStyle($code);

      const wrap = $code.style.wordBreak === "break-all",
        lines = $code.innerText.split("\n"),
        lineCount = Math.max(lines.length - 1, 1),
        lineNumDigits = (Math.log(lineCount) * Math.LOG10E + 1) | 0;

      const update =
        parseInt($block.dataset.lines) !== lineCount ||
        $block.dataset.wrap !== String(wrap);
      if (!update) continue;
      $block.dataset.lines = lineCount;
      $block.dataset.wrap = wrap;

      // shrink block to allow space for numbers
      $block.style.justifyContent = "flex-end";
      $code.style.minWidth = `calc(100% - 32px - ${lineNumDigits}ch)`;
      $code.style.maxWidth = $code.style.minWidth;

      // get 1ch in pixels
      const $tmp = html`<span style="width:1ch"> </span>`;
      $code.append($tmp);
      const charWidth = getComputedStyle($tmp).getPropertyValue("width");
      $tmp.remove();

      // work out height of wrapped lines
      const lineWidth =
          parseFloat(computedStyles.getPropertyValue("width")) -
          parseFloat(computedStyles.getPropertyValue("padding-left")) -
          parseFloat(computedStyles.getPropertyValue("padding-right")),
        charsPerLine = Math.floor(lineWidth / parseFloat(charWidth)),
        lineHeight = parseFloat(computedStyles.getPropertyValue("line-height"));

      const $numbers = html`<div
        class="${lineNumbersClass} font-[var(--font--code)] flex-grow
          text-([85%] [var(--theme--fg-secondary)] right) pt-[34px] pb-[32px]"
      ></div>`;
      for (let i = 1; i <= lineCount; i++) {
        let lineSpan = 1;
        if (wrap) lineSpan = Math.ceil(lines[i - 1].length / charsPerLine);
        $numbers.append(
          html`<${LineNumber}
            number=${i}
            height=${(lineSpan || 1) * lineHeight}
          />`
        );
      }

      const $prev = $block.getElementsByClassName(lineNumbersClass)[0];
      $prev ? $prev.replaceWith($numbers) : $block.prepend($numbers);
    }
  };

  addMutationListener(codeBlockSelector, numberLines);
};
