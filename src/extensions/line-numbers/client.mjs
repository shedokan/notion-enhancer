/**
 * notion-enhancer: line numbers
 * (c) 2020 CloudHill <rl.cloudhill@gmail.com> (https://github.com/CloudHill)
 * (c) 2024 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://notion-enhancer.github.io/) under the MIT license
 */

function LineNumbers({ decorationStyle = "None" }) {
  const { html } = globalThis.__enhancerApi,
    decorations = {
      Border: `pr-[16px] border-r-([2px]
      [color:var(--theme--bg-hover)])`,
      Background: `pr-[4px] before:(absolute block
      h-full w-[calc(100%-24px)] rounded-[4px] right-0
      content-empty bg-[var(--theme--bg-hover)] z-[-1])`,
    };
  return html`<div
    class="notion-enhancer--line-numbers mt-[34px]
    text-([85%] [var(--theme--fg-secondary)] right)
    font-[var(--font--code)] overflow-hidden select-none
    relative flex-grow ${decorations[decorationStyle] || ""}"
  ></div>`;
}

export default async (api, db) => {
  const { html, addMutationListener } = api,
    decorationStyle = await db.get("decorationStyle"),
    numberSingleLines = await db.get("numberSingleLines"),
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
        numLines = Math.max(lines.length - 1, 1),
        numChars = lines.map((line) => line.length).join(","),
        numDigits = (Math.log(numLines) * Math.LOG10E + 1) | 0;

      if ($code.dataset.lines === wrap + "," + numChars) continue;
      $code.dataset.lines = wrap + "," + numChars;

      // do not add to single-line blocks if disabled
      const visible = numberSingleLines || numLines > 1,
        width = visible
          ? decorationStyle === "Border"
            ? `calc(100% - 50px - ${numDigits}ch)`
            : `calc(100% - 32px - ${numDigits}ch)`
          : "",
        paddingLeft = visible && decorationStyle === "Border" ? "16px" : "32px";
      // shrink block to allow space for numbers
      applyStyles($code.parentElement, { justifyContent: "flex-end" });
      applyStyles($code, { minWidth: width, maxWidth: width, paddingLeft });

      // calculate heights of wrapped lines and render line nums
      let totalHeight = 0;
      const lineHeight = getLineHeight($code),
        charsPerLine = Math.floor(getLineWidth($code) / getCharWidth($code));
      $code._$lineNumbers ||= html`<${LineNumbers}...${{ decorationStyle }} />`;
      for (let i = 1; i <= numLines; i++) {
        const $n = $code._$lineNumbers.children[i - 1] || html`<p>${i}</p>`;
        if (!$code._$lineNumbers.contains($n)) $code._$lineNumbers.append($n);
        const wrappedHeight =
          wrap && lines[i - 1].length > charsPerLine
            ? Math.ceil(lines[i - 1].length / charsPerLine) * lineHeight
            : lineHeight;
        applyStyles($n, { height: `${wrappedHeight}px` });
        totalHeight += wrappedHeight;
      }
      applyStyles($code._$lineNumbers, {
        display: visible ? "" : "none",
        height: `${totalHeight}px`,
      });

      if (visible && !document.contains($code._$lineNumbers)) {
        $code.before($code._$lineNumbers);
      } else if (!visible) $code._$lineNumbers.style.display = "none";
    }
  };

  addMutationListener(codeBlockSelector, numberLines);
};
