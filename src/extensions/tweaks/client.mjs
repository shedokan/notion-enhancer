/**
 * notion-enhancer: tweaks
 * (c) 2024 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://notion-enhancer.github.io/) under the MIT license
 */

const tweaksId = "5174a483-c88d-4bf8-a95f-35cd330b76e2";
export default async (api, db) => {
  const { getMods, addKeyListener } = api,
    [{ options }] = await getMods((mod) => mod.id === tweaksId),
    tweaks = options
      .filter((opt) => opt.type === "toggle")
      .map((opt) => opt.key),
    enabled = {};
  for (const tweak of tweaks) enabled[tweak] = await db.get(tweak);

  // inc. leading & trailing comma for selectors (see client.css)
  document.body.dataset.tweaks =
    "," + tweaks.filter((tweak) => enabled[tweak]).join(",") + ",";

  if (enabled["hideSlashMenu"])
    addKeyListener("/", () => document.body.click(), true);
};
