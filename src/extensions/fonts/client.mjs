/**
 * notion-enhancer: fonts
 * (c) 2021 TorchAtlas (https://github.com/torchatlas/)
 * (c) 2021 admiraldus (https://github.com/admiraldus
 * (c) 2024 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://notion-enhancer.github.io/) under the MIT license
 */

export default async (api, db) => {
  const $root = document.documentElement;
  for (const style of [
    "sans",
    "serif",
    "mono",
    "code",
    "math",
    "quotes",
    "headings",
  ]) {
    const font = await db.get(style);
    if (font) $root.style.setProperty(`--font--${style}`, font);
  }
};
