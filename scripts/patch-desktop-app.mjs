/**
 * notion-enhancer
 * (c) 2023 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://notion-enhancer.github.io/) under the MIT license
 */

// patch scripts within notion's sources to
// activate and respond to the notion-enhancer
const injectTriggerOnce = (file, content) =>
    content +
    (!/require\(['|"]notion-enhancer['|"]\)/.test(content)
      ? `\n\nrequire("notion-enhancer")('${file}',exports,(js)=>eval(js));`
      : ""),
  replaceIfNotFound = ({ string, mode = "replace" }, search, replacement) =>
    string.includes(replacement)
      ? string
      : string.replace(
          search,
          typeof replacement === "string" && mode === "append"
            ? `$&${replacement}`
            : typeof replacement === "string" && mode === "prepend"
            ? `${replacement}$&`
            : replacement
        );

const patches = {
  // prettier-ignore
  ".webpack/main/index.js": (file, content) => {
    content = injectTriggerOnce(file, content);
    const replace = (...args) =>
        (content = replaceIfNotFound(
          { string: content, mode: "replace" },
          ...args
        )),
      prepend = (...args) =>
        (content = replaceIfNotFound(
          { string: content, mode: "prepend" },
          ...args
        ));

    // https://github.com/notion-enhancer/notion-enhancer/issues/160:
    // enable the notion:// protocol, windows-style tab layouts, and
    // quitting the app when the last window is closed on linux
    const isWindows =
        /(?:"win32"===process\.platform(?:(?=,isFullscreen)|(?=&&\w\.BrowserWindow)|(?=&&\(\w\.app\.requestSingleInstanceLock)))/g,
      isWindowsOrLinux = '["win32","linux"].includes(process.platform)';
    replace(isWindows, isWindowsOrLinux);

    // restore node integration in the renderer process
    // so the notion-enhancer can be require()-d into it
    replace(/sandbox:!0/g, `sandbox:!1,nodeIntegration:!0,session:require('electron').session.fromPartition("persist:notion")`);

    // bypass webRequest filter to load enhancer menu
    replace(/(\w)\.top!==\w\?(\w)\(\{cancel:!0\}\)/, "$1.top!==$1?$2({})");

    // https://github.com/notion-enhancer/desktop/issues/291
    // bypass csp issues by intercepting the notion:// protocol
    const protocolHandler = /try\{const \w=await \w\.assetCache\.handleRequest\(\w\);/,
      protocolInterceptor = `{const n="notion://www.notion.so/__notion-enhancer/";if(e.url.startsWith(n))return require("electron").net.fetch(\`file://\${require("path").join(__dirname,"..","..","node_modules","notion-enhancer",e.url.slice(n.length))}\`)}`;
    prepend(protocolHandler, protocolInterceptor);
    
    // expose the app config to the global namespace for manipulation
    // e.g. to enable development mode
    prepend(/\w\.exports=JSON\.parse\('\{"env":"production"/, "globalThis.__notionConfig=");

    // expose the app store to the global namespace for reading
    // e.g. to check if keep in background is enabled
    prepend(/\w\.Store=\(0,\w\.configureStore\)/, "globalThis.__notionStore=");
    prepend(/\w\.updatePreferences=\w\.updatePreferences/, "globalThis.__updatePreferences=");

    // conditionally create frameless windows
    const titlebarStyle = `titleBarStyle:globalThis.__notionConfig?.titlebarStyle??"hiddenInset"`;
    replace(`titleBarStyle:"hiddenInset"`, titlebarStyle);

    return content;
  },
  ".webpack/renderer/tabs/preload.js": injectTriggerOnce,
  ".webpack/renderer/tab_browser_view/preload.js": injectTriggerOnce,
};

const decoder = new TextDecoder(),
  encoder = new TextEncoder();
export default (file, content) => {
  if (!patches[file]) return content;
  content = decoder.decode(content);
  content = patches[file](file, content);
  return encoder.encode(content);
};
