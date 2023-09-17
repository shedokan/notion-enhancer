/**
 * notion-enhancer: right to left
 * (c) 2021 obahareth <omar@omar.engineer> (https://omar.engineer)
 * (c) 2021 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://notion-enhancer.github.io/) under the MIT license
 */

'use strict';

export default async function ({ web }, db) {
  //observer && observer.disconnect();

const dragFrame = $('#notion-app > div > div:nth-child(1) > div > div:nth-child(2) > main > div > div:nth-child(1)'),
      notionScroller = dragFrame?.parentElement;

function logChanges(mutationList, observer) {
    console.log(mutationList.map((m) => !m.addedNodes.length));
    if(mutationList.every((m) => !m.addedNodes.length)) return;
    
    const dragHandle = document.querySelector('div[aria-label="Drag"]')?.parentElement,
      dragContainer = dragHandle?.parentElement?.parentElement,
      dataBlockId = dragHandle?.getAttribute('data-block-id'),
      newRight = (notionScroller.clientWidth + parseInt(dragContainer.style.left)) + 'px';;
    //dataBlockId && document.querySelectorAll('div[data-block-id="' + dataBlockId + '"]')[1];
    dragContainer.style.right = newRight;
    dragContainer.style.left = '';
    console.log(`Updated right to: ${newRight}`);
    console.log(mutationList)

  // for (const record of mutationList) {
  //   for (const addedNode of record.addedNodes) {
  //     console.log(`Added: ${addedNode.textContent}`);
  //   }
  //   for (const removedNode of record.removedNodes) {
  //     console.log(`Removed: ${removedNode.textContent}`);
  //   }
  //   if (record.target.childNodes.length === 0) {
  //     console.log(`Disconnected`);
  //     observer.disconnect();
  //   }
  //   console.log(record.target.childNodes.length);
  // }
}

const observer = new MutationObserver(logChanges);
observer.observe(dragFrame.querySelector('\div'), {
  childList: true,
  // subtree: true,
});



  
  const pageContentSelector = `
      .notion-page-content >
        div[data-block-id]:not([dir]):not(.notion-column_list-block):not(.notion-collection_view_page-block),
      [placeholder="Untitled"]:not([dir]),
      .notion-column-block > div[data-block-id]:not([dir]),
      .notion-collection_view-block:not([dir]),
      .notion-table-view:not([dir]),
      .notion-board-view:not([dir]),
      .notion-gallery-view:not([dir])`,
    listItemSelector = `
      div[placeholder="List"]:not([style*="text-align: start"]),
      div[placeholder="To-do"]:not([style*="text-align: start"]),
      div[placeholder="Toggle"]:not([style*="text-align: start"])`,
    inlineEquationSelector =
      '.notion-text-equation-token .katex-html:not([style*="direction: rtl;"])';

  const autoAlignText = () => {
    document
      .querySelectorAll(pageContentSelector)
      .forEach(($block) => $block.setAttribute('dir', 'auto'));
    document.querySelectorAll(listItemSelector).forEach(($item) => {
      $item.style['text-align'] = 'start';
    });
    document.querySelectorAll(inlineEquationSelector).forEach(($equation) => {
      $equation.style.direction = 'rtl';
      $equation.style.display = 'inline-flex';
      $equation.style.flexDirection = 'row-reverse';
      for (const $symbol of $equation.children) {
        $symbol.style.direction = 'ltr';
      }
    });
  };
  
  web.addDocumentObserver(autoAlignText, [
    pageContentSelector,
    listItemSelector,
    inlineEquationSelector,
  ]);
  await web.whenReady();
  autoAlignText();
}
