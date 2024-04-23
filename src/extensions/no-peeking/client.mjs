/**
 * notion-enhancer: no peeking
 * (c) 2021 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://notion-enhancer.github.io/) under the MIT license
 */

export default async (api) => {
  const { addMutationListener } = api,
    peekRenderer = ".notion-peek-renderer",
    openInFullPage = `[aria-label="Open in full page"]`,
    pageId = () => location.pathname.split(/-|\//g).at(-1),
    peekId = () => new URLSearchParams(location.search).get("p");

  let _pageId = pageId();
  const skipPeek = () => {
    const $openInFullPage = document.querySelector(openInFullPage);
    if (peekId() === _pageId) {
      _pageId = pageId();
      history.back();
    } else if (peekId() && $openInFullPage) {
      _pageId = peekId();
      $openInFullPage.click();
    } else _pageId = pageId();
  };
  addMutationListener(peekRenderer, skipPeek);
};
