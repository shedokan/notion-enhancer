/**
 * notion-enhancer: scroller
 * (c) 2021 CloudHill <rl.cloudhill@gmail.com> (https://github.com/CloudHill)
 * (c) 2024 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://notion-enhancer.github.io/) under the MIT license
 */

import { FloatingButton } from "../../core/islands/FloatingButton.mjs";

export default async (api, db) => {
  const { html, addFloatingButton, removeFloatingButton } = api,
    { addMutationListener, removeMutationListener } = api,
    jumpToWeek = await db.get("jumpToWeek"),
    todayButton = `.notion-collection_view_page-block [aria-label="Previous Month"] + [role="button"]`,
    todayBubble = `.notion-calendar-view-day[style*="background"]`,
    showScrollToBottom = await db.get("showScrollToBottom"),
    distanceUntilShown = await db.get("distanceUntilScrollToTopShown"),
    scrollUnit = await db.get("scrollDistanceUnit"),
    scrollBehavior = (await db.get("smoothScrolling")) ? "smooth" : "auto",
    scroller = ".notion-frame .notion-scroller";

  let $scroller, $todayButton;
  const scrollTo = (top, behavior) => $scroller?.scroll({ top, behavior }),
    $scrollToBottom = html`<${FloatingButton}
      onclick="${() => scrollTo($scroller.scrollHeight, scrollBehavior)}"
      aria-label="Scroll to bottom"
      ><i class="i-chevrons-down" />
    <//>`,
    $scrollToTop = html`<${FloatingButton}
      onclick=${() => scrollTo(0, scrollBehavior)}
      aria-label="Scroll to top"
      ><i class="i-chevrons-up" />
    <//>`,
    onPageScrolled = () => {
      if (!$scroller) return;
      const { scrollTop, scrollHeight, clientHeight } = $scroller;
      let scrollDist = scrollTop;
      if (scrollUnit === "Percent") {
        scrollDist = (scrollTop / (scrollHeight - clientHeight)) * 100;
        if (isNaN(scrollDist)) scrollDist = 0;
      }
      if (distanceUntilShown <= scrollDist) {
        if (document.contains($scrollToBottom))
          $scrollToBottom.replaceWith($scrollToTop);
        else addFloatingButton($scrollToTop);
      } else if (showScrollToBottom) {
        if (document.contains($scrollToTop))
          $scrollToTop.replaceWith($scrollToBottom);
        else addFloatingButton($scrollToBottom);
      } else removeFloatingButton($scrollToTop);
    },
    onTodayLoaded = () => {
      const $bubble = document.querySelector(todayBubble);
      if (!$bubble) return;
      // calendar will jump anyway when pinning the current month,
      // so ignore smooth scroll setting and jump direct to week
      scrollTo($bubble.offsetParent.offsetParent.offsetTop + 57, "auto");
      removeMutationListener(onTodayLoaded);
    },
    onTodayClicked = () => {
      removeMutationListener(onTodayLoaded);
      addMutationListener(todayBubble, onTodayLoaded);
    },
    setup = () => {
      if (document.contains($scroller)) return;
      $scroller = document.querySelector(scroller);
      $scroller?.removeEventListener("scroll", onPageScrolled);
      $scroller?.addEventListener("scroll", onPageScrolled);
      onPageScrolled();
      if (jumpToWeek) {
        $todayButton = document.querySelector(todayButton);
        $todayButton?.removeEventListener("click", onTodayClicked);
        $todayButton?.addEventListener("click", onTodayClicked);
      }
    };
  addMutationListener(scroller, setup, { subtree: false });
  setup();
};
