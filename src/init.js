/**
 * notion-enhancer
 * (c) 2024 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://notion-enhancer.github.io/) under the MIT license
 */

"use strict";

const coreId = "0f0bf8b6-eae6-4273-b307-8fc43f2ee082",
  isElectron = () => {
    try {
      return typeof module !== "undefined";
    } catch {}
    return false;
  };

if (isElectron()) {
  require("./api/system.js");
  require("./api/registry.js");

  const { enhancerUrl } = globalThis.__enhancerApi,
    { getMods, isEnabled, modDatabase } = globalThis.__enhancerApi;

  module.exports = async (target, __exports, __eval) => {
    const __getApi = () => globalThis.__enhancerApi;
    if (target === ".webpack/main/index.js") require("./worker.js");
    else {
      // expose globalThis.__enhancerApi to scripts
      const { contextBridge } = require("electron");
      contextBridge.exposeInMainWorld("__getEnhancerApi", __getApi);

      // load clientStyles, clientScripts
      document.addEventListener("readystatechange", async () => {
        if (document.readyState !== "complete") return false;
        const $script = document.createElement("script");
        $script.type = "module";
        $script.src = enhancerUrl("load.mjs");
        document.head.append($script);

        // register user-provided javascript for execution in-app
        if (target === ".webpack/renderer/tab_browser_view/preload.js") {
          const db = await modDatabase(coreId),
            { webFrame } = require("electron"),
            customScript = (await db.get("customScript"))?.content;
          if (customScript) webFrame.executeJavaScript(customScript);
        }
      });
    }

    // load electronScripts
    for (const mod of await getMods()) {
      if (!mod.electronScripts || !(await isEnabled(mod.id))) continue;
      const db = await modDatabase(mod.id);
      for (let [scriptTarget, script] of mod.electronScripts ?? []) {
        if (target !== scriptTarget) continue;
        try {
          script = require(`./${mod._src}/${script}`);
          script(__getApi(), db, __exports, __eval);
        } catch (err) {
          console.error(err);
        }
      }
    }
  };
} else {
  import(chrome.runtime.getURL("/api/system.js")) //
    .then(() => import(chrome.runtime.getURL("/load.mjs")));
}
