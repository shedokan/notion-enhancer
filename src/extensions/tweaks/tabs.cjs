/**
 * notion-enhancer: tweaks
 * (c) 2024 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://notion-enhancer.github.io/) under the MIT license
 */

"use strict";

module.exports = async (api, db) => {
  const tabStyle = await db.get("tabStyle");
  document.body.dataset.tweaks = ",tabStyle=" + tabStyle + ",";
};
