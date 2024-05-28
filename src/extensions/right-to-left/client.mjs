/**
 * notion-enhancer: right to left
 * (c) 2021 obahareth <omar@omar.engineer> (https://omar.engineer)
 * (c) 2024 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://notion-enhancer.github.io/) under the MIT license
 */

export default async (api) => {
  const { addMutationListener } = api,
    pageContentSelector = `
      :is(.notion-page-content >
        div[data-block-id]:not(.notion-column_list-block):not(.notion-collection_view_page-block),
      .notion-page-content .notion-table_of_contents-block a,
      [placeholder="Untitled"],
      .notion-column-block > div[data-block-id],
      .notion-collection_view-block,
      .notion-table-view,
      .notion-board-view,
      .notion-gallery-view):not([dir])`,
    listItemSelector = `:is(div[placeholder="List"], div[placeholder="To-do"],
      div[placeholder="Toggle"]):not([style*="text-align: start"])`,
    inlineEquationSelector =
      '.notion-text-equation-token .katex-html:not([style*="direction: rtl;"])';
  const autoAlignText = () => {
    document
      .querySelectorAll(pageContentSelector)
      .forEach(($block) => $block.setAttribute("dir", "auto"));
    document.querySelectorAll(listItemSelector).forEach(($item) => {
      $item.style["text-align"] = "start";
    });
    document.querySelectorAll(inlineEquationSelector).forEach(($equation) => {
      $equation.style.direction = "rtl";
      $equation.style.display = "inline-flex";
      $equation.style.flexDirection = "row-reverse";
      for (const $symbol of $equation.children) {
        $symbol.style.direction = "ltr";
      }
    });
  };

  const textareas = [
    pageContentSelector,
    listItemSelector,
    inlineEquationSelector,
  ].join(",");
  addMutationListener(textareas, autoAlignText);
};
