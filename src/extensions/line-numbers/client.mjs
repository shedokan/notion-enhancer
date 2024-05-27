/**
 * notion-enhancer: line numbers
 * (c) 2020 CloudHill <rl.cloudhill@gmail.com> (https://github.com/CloudHill)
 * (c) 2024 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://notion-enhancer.github.io/) under the MIT license
 */

function LineNumbers() {
  const { html } = globalThis.__enhancerApi;
  return html`<div
    class="notion-enhancer--line-numbers flex-grow
    text-([85%] [var(--theme--fg-secondary)] right)
    font-[var(--font--code)] pt-[34px] pb-[32px]
    overflow-hidden"
  ></div>`;
}

export default async (api, db) => {
  const { html, addMutationListener } = api,
    numberSingleLines = await db.get("numberSingleLines"),
    lineNumberDecoration = await db.get("lineNumberDecoration"),
    lineNumbersClass = "notion-enhancer--line-numbers",
    codeBlockSelector = ".notion-code-block.line-numbers > .notranslate";

  // get character width in pixels
  const getCharWidth = ($elem) => {
      const $char = html`<span style="width:1ch"> </span>`;
      $elem.append($char);
      const charWidth = getComputedStyle($char).getPropertyValue("width");
      $char.remove();
      return parseFloat(charWidth);
    },
    // get line width in pixels
    getLineWidth = ($elem) =>
      parseFloat(getComputedStyle($elem).getPropertyValue("width")) -
      parseFloat(getComputedStyle($elem).getPropertyValue("padding-left")) -
      parseFloat(getComputedStyle($elem).getPropertyValue("padding-right")),
    // get line height in pixels
    getLineHeight = ($elem) =>
      parseFloat(getComputedStyle($elem).getPropertyValue("line-height")),
    // update inline styles without unnecessary dom updates
    applyStyles = ($elem, styles) => {
      for (const property in styles) {
        if ($elem.style[property] === styles[property]) continue;
        $elem.style[property] = styles[property];
      }
    };

  const numberLines = () => {
    for (const $code of document.querySelectorAll(codeBlockSelector)) {
      const wrap = $code.style.wordBreak === "break-all",
        lines = $code.innerText.split("\n"),
        lineCount = Math.max(lines.length - 1, 1),
        lineNumDigits = (Math.log(lineCount) * Math.LOG10E + 1) | 0;

      const doUpdate =
        $code.dataset.lines !== String(lineCount) ||
        $code.dataset.wrap !== String(wrap);
      if (!doUpdate) continue;
      $code.dataset.lines = lineCount;
      $code.dataset.wrap = wrap;

      // shrink block to allow space for numbers
      const width = `calc(100% - 32px - ${lineNumDigits}ch)`;
      applyStyles($code.parentElement, { justifyContent: "flex-end" });
      applyStyles($code, { minWidth: width, maxWidth: width });

      // work out height of wrapped lines
      const lineHeight = getLineHeight($code),
        charsPerLine = Math.floor(getLineWidth($code) / getCharWidth($code));

      // update line numbers in dom
      let totalHeight = 34;
      $code._$lineNumbers ||= LineNumbers();
      for (let i = 1; i <= lineCount; i++) {
        let $n = $code._$lineNumbers.children[i - 1];
        if (!$n) {
          $n = html`<span class="block text-right">${i}</span>`;
          $code._$lineNumbers.append($n);
        }
        const height =
          wrap && lines[i - 1].length > charsPerLine
            ? Math.ceil(lines[i - 1].length / charsPerLine) * lineHeight
            : lineHeight;
        applyStyles($n, { height: `${height}px` });
        totalHeight += height;
      }
      applyStyles($code._$lineNumbers, { height: `${totalHeight}px` });

      if (!document.contains($code._$lineNumbers))
        $code.before($code._$lineNumbers);
    }
  };

  addMutationListener(codeBlockSelector, numberLines);
};
